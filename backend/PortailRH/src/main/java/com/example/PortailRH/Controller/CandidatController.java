package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.Candidature;
import com.example.PortailRH.Model.candidat;
import com.example.PortailRH.Repository.CandidatRepository;
import com.example.PortailRH.Repository.CandidatureRepository;
import com.example.PortailRH.Service.AIService;
import com.example.PortailRH.Service.EmailService;
import com.example.PortailRH.Service.NotificationService;
import com.example.PortailRH.Service.ScoreCalculationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize; // Assuming Spring Security is used
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.TimeoutException;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/candidats") // Base path for all candidate-related endpoints
public class CandidatController {
    private static final Logger logger = LoggerFactory.getLogger(CandidatController.class);

    private final CandidatRepository candidatRepository;
    private final CandidatureRepository candidatureRepository;
    private final AIService aiService;
    private final EmailService emailService; // Assuming you have an EmailService
    private final ScoreCalculationService scoreCalculationService;
    private final Path uploadPath; // Path where CV files are stored
    @Autowired
    private NotificationService notificationService;
    @Autowired
    public CandidatController(CandidatRepository candidatRepository,
                              CandidatureRepository candidatureRepository,
                              AIService aiService,
                              EmailService emailService,
                              ScoreCalculationService scoreCalculationService,
                              // Inject upload directory path from application properties
                              @Value("${file.upload-dir}") String uploadDir) {
        this.candidatRepository = candidatRepository;
        this.candidatureRepository = candidatureRepository;
        this.aiService = aiService;
        this.emailService = emailService;
        this.scoreCalculationService = scoreCalculationService;
        // Resolve and normalize the upload path
        this.uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        // Attempt to create the directory on startup
        createUploadDir();
    }

    /**
     * Endpoint to create a new candidate application.
     * Receives candidate details, the ID of the job posting they are applying for, and their CV file.
     * Saves the CV, creates the candidate record, triggers AI analysis and scoring, and sends confirmation.
     */
    @PostMapping(consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    @PreAuthorize("hasRole('CANDIDATE') or hasRole('ADMIN') or hasRole('RECRUITER')")
    public ResponseEntity<?> createCandidate(
            @RequestParam String nom,
            @RequestParam String prenom,
            @RequestParam Integer age,
            @RequestParam String email,
            @RequestParam String numTel,
            @RequestParam String candidatureId,
            @RequestParam("cv") MultipartFile cv) {

        logger.info("Received request to create candidate: {} {} for candidature ID: {}", nom, prenom, candidatureId);

        if (cv == null || cv.isEmpty()) {
            logger.warn("CV file is missing for candidate {} {}", nom, prenom);
            return ResponseEntity.badRequest().body(Map.of("error", "CV file is required"));
        }
        if (candidatureId == null || candidatureId.isBlank()) {
            logger.warn("Candidature ID is missing for candidate {} {}", nom, prenom);
            return ResponseEntity.badRequest().body(Map.of("error", "Candidature ID (Job Posting ID) is required"));
        }

        String cvPath = null;
        candidat initialSavedCandidate = null;
        Candidature jobPosting = null;

        try {
            jobPosting = candidatureRepository.findById(candidatureId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Job Posting (Candidature) with ID " + candidatureId + " not found"));
            logger.info("Found job posting: {}", jobPosting.getId());

            cvPath = saveCVFile(cv);
            logger.info("Saved CV for {} {} to path: {}", nom, prenom, cvPath);

            candidat candidateToCreate = buildCandidate(nom, prenom, age, email, numTel, cvPath, jobPosting);
            initialSavedCandidate = candidatRepository.save(candidateToCreate);
            logger.info("Initially saved candidate with ID: {}", initialSavedCandidate.getId());

            try {
                processCandidateCVAndScore(initialSavedCandidate, jobPosting);

                candidat finalCandidate = candidatRepository.save(initialSavedCandidate);
                logger.info("Successfully processed and saved final candidate: {}", finalCandidate.getId());

                // ✅ Send confirmation email with both candidate and candidature
                emailService.sendCandidateConfirmation(finalCandidate, jobPosting);

                // Send WebSocket notification to admins
                notificationService.createNotification(
                        "Nouveau candidat a postulé: " + nom + " " + prenom,
                        "Admin",
                        null,
                        null,
                        null
                );

                return ResponseEntity.status(HttpStatus.CREATED).body(toResponseDTO(finalCandidate));

            } catch (Exception processingException) {
                logger.error("Candidate {} created, but CV analysis or scoring failed: {}", initialSavedCandidate.getId(), processingException.getMessage(), processingException);
                Map<String, Object> responseBody = new HashMap<>();
                responseBody.put("message", "Candidate created but post-processing (AI analysis/scoring) failed. Manual review might be needed.");
                responseBody.put("candidate", toResponseDTO(candidatRepository.findById(initialSavedCandidate.getId()).orElse(initialSavedCandidate)));
                responseBody.put("error_details", processingException.getMessage());

                // Still send basic confirmation
                emailService.sendCandidateConfirmation(initialSavedCandidate, jobPosting);

                return ResponseEntity.status(HttpStatus.ACCEPTED).body(responseBody);
            }
        } catch (ResponseStatusException e) {
            logger.error("Failed to create candidate {} {}: {}", nom, prenom, e.getReason());
            if (cvPath != null) try { deleteCVFile(cvPath); } catch (IOException cl) { logger.warn("Failed to cleanup CV file {} after error", cvPath, cl); }
            return ResponseEntity.status(e.getStatusCode()).body(Map.of("error", e.getReason()));
        } catch (IOException e) {
            logger.error("File handling error creating candidate {} {}: {}", nom, prenom, e.getMessage(), e);
            if (cvPath != null) try { deleteCVFile(cvPath); } catch (IOException cl) { logger.warn("Failed to cleanup CV file {} after IO error", cvPath, cl); }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Error saving CV file", "details", e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error creating candidate {} {}: {}", nom, prenom, e.getMessage(), e);
            if (cvPath != null) try { deleteCVFile(cvPath); } catch (IOException cl) { logger.warn("Failed to cleanup CV file {} after unexpected error", cvPath, cl); }
            if (initialSavedCandidate != null && initialSavedCandidate.getId() != null) {
                try { candidatRepository.deleteById(initialSavedCandidate.getId()); } catch (Exception delEx) { logger.warn("Failed to cleanup candidate record {} after error", initialSavedCandidate.getId(), delEx); }
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "An unexpected error occurred during candidate creation", "details", e.getMessage()));
        }
    }


    /**
     * Endpoint to retrieve a paginated list of all candidates, optionally filtered by search term.
     */
    @GetMapping
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAllCandidates(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size, // Default page size
            @RequestParam(defaultValue = "dateCandidature,desc") String sort) { // Default sort order

        logger.debug("Request received for getAllCandidates: search={}, page={}, size={}, sort={}", search, page, size, sort);
        try {
            // --- Sorting Logic ---
            Sort sortOrder;
            try {
                if (sort != null && sort.contains(",")) {
                    String[] sortParams = sort.split(",");
                    Sort.Direction direction = sortParams.length > 1 && "asc".equalsIgnoreCase(sortParams[1]) ? Sort.Direction.ASC : Sort.Direction.DESC;
                    sortOrder = Sort.by(direction, sortParams[0]);
                } else {
                    sortOrder = Sort.by(Sort.Order.desc("dateCandidature")); // Default if format is wrong
                }
            } catch (Exception e) {
                logger.warn("Invalid sort parameter '{}', using default sort.", sort, e);
                sortOrder = Sort.by(Sort.Order.desc("dateCandidature"));
            }

            // --- Pagination ---
            Pageable pageable = PageRequest.of(page, size, sortOrder);
            Page<candidat> candidatePage;

            // --- Data Fetching ---
            if (search != null && !search.isBlank()) {
                logger.debug("Searching candidates with term: {}", search);
                // Example search across multiple fields
                candidatePage = candidatRepository.findByNomContainingIgnoreCaseOrPrenomContainingIgnoreCaseOrEmailContainingIgnoreCase(search, search, search, pageable);
            } else {
                logger.debug("Fetching all candidates (paginated)");
                candidatePage = candidatRepository.findAll(pageable);
            }

            // --- DTO Mapping ---
            List<CandidatResponse> candidates = candidatePage.getContent()
                    .stream()
                    .map(this::toResponseDTO) // Use the DTO mapping method
                    .collect(Collectors.toList());

            // --- Response Assembly ---
            Map<String, Object> response = new HashMap<>();
            response.put("candidates", candidates);
            response.put("currentPage", candidatePage.getNumber());
            response.put("totalItems", candidatePage.getTotalElements());
            response.put("totalPages", candidatePage.getTotalPages());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error getting candidates", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to retrieve candidates", "details", e.getMessage()));
        }
    }

    /**
     * Endpoint to retrieve a single candidate by their ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN') or @securityService.isOwner(#id)") // Example: Check if user owns the profile
    public ResponseEntity<CandidatResponse> getCandidateById(@PathVariable String id) {
        logger.debug("Request received for getCandidateById: {}", id);
        try {
            return candidatRepository.findById(id)
                    .map(candidate -> ResponseEntity.ok(toResponseDTO(candidate))) // Map found candidate to DTO
                    .orElseGet(() -> {
                        logger.warn("Candidate not found with ID: {}", id);
                        return ResponseEntity.notFound().build(); // Return 404 if not found
                    });
        } catch (Exception e) {
            logger.error("Error getting candidate by ID: {}", id, e);
            // Don't expose internal error details unless necessary
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Endpoint to get the count of candidates associated with a specific job posting (Candidature).
     */
    @GetMapping("/{positionId}/candidate-count")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    public ResponseEntity<Long> getCandidateCountForPosition(@PathVariable String positionId) {
        logger.debug("Request received for candidate count for position ID: {}", positionId);
        try {
            // Ensure the position (Candidature) exists before counting
            if (!candidatureRepository.existsById(positionId)) {
                logger.warn("Candidate count request failed: Position (Candidature) not found with ID: {}", positionId);
                // Return 0 or 404 depending on desired behavior for non-existent positions
                return ResponseEntity.notFound().build();
                // return ResponseEntity.ok(0L); // Alternative: return 0 count
            }
            long count = candidatRepository.countByCandidaturesId(positionId);
            logger.info("Found {} candidates for position ID: {}", count, positionId);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            logger.error("Error getting candidate count for position {}", positionId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }


    /**
     * Endpoint to retrieve candidates associated with a specific job posting (Candidature), paginated.
     */
    @GetMapping("/by-position/{positionId}")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getCandidatesByPosition(
            @PathVariable String positionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "dateCandidature,desc") String sort) { // Added sorting

        logger.debug("Request received for getCandidatesByPosition: positionId={}, page={}, size={}, sort={}", positionId, page, size, sort);
        try {
            // --- Sorting Logic (similar to getAllCandidates) ---
            Sort sortOrder;
            try {
                if (sort != null && sort.contains(",")) {
                    String[] sortParams = sort.split(",");
                    Sort.Direction direction = sortParams.length > 1 && "asc".equalsIgnoreCase(sortParams[1]) ? Sort.Direction.ASC : Sort.Direction.DESC;
                    sortOrder = Sort.by(direction, sortParams[0]);
                } else {
                    sortOrder = Sort.by(Sort.Order.desc("dateCandidature")); // Default
                }
            } catch (Exception e) {
                logger.warn("Invalid sort parameter '{}' for position {}, using default sort.", sort, positionId, e);
                sortOrder = Sort.by(Sort.Order.desc("dateCandidature"));
            }


            // --- Pagination ---
            Pageable pageable = PageRequest.of(page, size, sortOrder);

            // --- Data Fetching ---
            // Ensure the position (Candidature) exists before querying
            if (!candidatureRepository.existsById(positionId)) {
                logger.warn("Get candidates by position failed: Position (Candidature) not found with ID: {}", positionId);
                return ResponseEntity.notFound().build();
            }

            Page<candidat> candidatePage = candidatRepository.findByCandidaturesId(positionId, pageable);

            // --- DTO Mapping & Response Assembly ---
            long totalCountForPosition = candidatePage.getTotalElements(); // Total candidates for THIS position
            List<CandidatResponse> candidates = candidatePage.getContent()
                    .stream()
                    .map(c -> {
                        CandidatResponse dto = toResponseDTO(c);
                        dto.setTotalCandidates(totalCountForPosition); // Add total count specific to this query
                        return dto;
                    })
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("candidates", candidates);
            response.put("currentPage", candidatePage.getNumber());
            response.put("totalItems", totalCountForPosition);
            response.put("totalPages", candidatePage.getTotalPages());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error getting candidates for position {}", positionId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to retrieve candidates for position", "details", e.getMessage()));
        }
    }

    /**
     * Endpoint to update basic information for an existing candidate.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isOwner(#id)") // Example authorization
    public ResponseEntity<?> updateCandidate(
            @PathVariable String id,
            @RequestBody CandidatUpdateRequest updateRequest) { // Use a DTO for the request body

        logger.info("Request received to update candidate ID: {}", id);
        try {
            return candidatRepository.findById(id)
                    .map(candidate -> {
                        logger.debug("Found candidate {} for update.", id);
                        updateCandidateFields(candidate, updateRequest); // Apply updates from request DTO
                        candidat updatedCandidate = candidatRepository.save(candidate);
                        logger.info("Successfully updated candidate {}", updatedCandidate.getId());
                        return ResponseEntity.ok(toResponseDTO(updatedCandidate)); // Return updated candidate DTO
                    })
                    .orElseGet(() -> {
                        logger.warn("Update failed: Candidate not found with ID: {}", id);
                        return ResponseEntity.notFound().build();
                    });
        } catch (Exception e) {
            logger.error("Error updating candidate {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to update candidate", "details", e.getMessage()));
        }
    }

    /**
     * Endpoint to download the CV file for a specific candidate.
     */
    @GetMapping("/{id}/cv")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN') or @securityService.isOwner(#id)") // Example authorization
    public ResponseEntity<Resource> downloadCV(@PathVariable String id) {
        logger.debug("Request received to download CV for candidate ID: {}", id);
        // 1. Find Candidate
        candidat candidate = candidatRepository.findById(id)
                .orElseThrow(() -> {
                    logger.warn("Download CV failed: Candidate not found with ID: {}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Candidate not found");
                });

        // 2. Check CV Path
        if (candidate.getCvFilePath() == null || candidate.getCvFilePath().isBlank()) {
            logger.warn("Download CV failed: No CV file path associated with candidate ID: {}", id);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "CV file path not found for this candidate.");
        }

        try {
            // 3. Resolve File Path and Create Resource
            Path filePath = Paths.get(candidate.getCvFilePath()).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            // 4. Check if File Exists and is Readable
            if (!resource.exists() || !resource.isReadable()) {
                logger.error("Download CV failed: CV file not found or not readable at path: {}", filePath);
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "CV file not found or cannot be read on the server.");
            }

            // 5. Determine Content Type
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream"; // Default fallback
            }
            logger.debug("Determined content type for CV {} as: {}", filePath, contentType);

            // 6. Generate Download Filename (Sanitized)
            String originalFileName = filePath.getFileName().toString();
            // Attempt to remove UUID prefix if present (simple check)
            int uuidSeparatorIndex = originalFileName.indexOf("_");
            String cleanBaseName = (uuidSeparatorIndex > 30 && uuidSeparatorIndex < 40) ?
                    originalFileName.substring(uuidSeparatorIndex + 1) : originalFileName;

            String downloadFilename = String.format("%s_%s_CV%s",
                    candidate.getNom().replaceAll("[^a-zA-Z0-9.-]", "_"), // Sanitize name parts
                    candidate.getPrenom().replaceAll("[^a-zA-Z0-9.-]", "_"),
                    getFileExtension(cleanBaseName)); // Get extension from cleaned name

            logger.info("Prepared CV download for candidate {} with filename: {}", id, downloadFilename);

            // 7. Build and Return Response Entity
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + downloadFilename + "\"")
                    .body(resource);

        } catch (MalformedURLException e) {
            logger.error("Error creating URL for CV path: {}", candidate.getCvFilePath(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error processing CV file path.");
        } catch (IOException e) {
            logger.error("Error reading CV file or determining content type for path: {}", candidate.getCvFilePath(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not read CV file: " + e.getMessage());
        } catch (Exception e) { // Catch any other unexpected errors during file processing
            logger.error("Unexpected error during CV download preparation for candidate {}", id, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred during CV download.");
        }
    }

    /**
     * Endpoint to manually trigger a re-analysis of a candidate's CV against their primary associated job posting.
     */
    @PostMapping("/{id}/reanalyze")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    public ResponseEntity<?> reanalyzeCandidateCV(@PathVariable String id) {
        logger.info("Request received to reanalyze CV for candidate ID: {}", id);
        try {
            // 1. Find Candidate
            candidat candidate = candidatRepository.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Candidate not found"));

            // 2. Validate CV Path and File Existence
            if (candidate.getCvFilePath() == null || candidate.getCvFilePath().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Candidate has no associated CV file path.");
            }
            Path cvFile = Paths.get(candidate.getCvFilePath());
            if (!Files.exists(cvFile)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "CV file not found on disk at path: " + candidate.getCvFilePath());
            }

            // 3. Find Associated Job Posting (assuming the first linked Candidature is the primary one)
            if (candidate.getCandidatures() == null || candidate.getCandidatures().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Candidate is not associated with any Job Posting (Candidature). Cannot determine context for reanalysis.");
            }
            // Use the ID from the potentially simplified reference stored in the candidate
            String relevantCandidatureId = candidate.getCandidatures().get(0).getId();

            Candidature relevantJobPosting = candidatureRepository.findById(relevantCandidatureId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Associated Job Posting (Candidature) with ID " + relevantCandidatureId + " not found."));

            logger.info("Reanalyzing candidate {} against job posting {}", id, relevantJobPosting.getId());

            // 4. Perform AI Analysis and Scoring
            processCandidateCVAndScore(candidate, relevantJobPosting);

            // 5. Save Updated Candidate and Return Result
            candidat updatedCandidate = candidatRepository.save(candidate);
            logger.info("Successfully reanalyzed and updated candidate {}", updatedCandidate.getId());
            return ResponseEntity.ok(toResponseDTO(updatedCandidate));

        } catch (ResponseStatusException e) { // Catch specific handled exceptions
            logger.warn("Reanalysis failed for candidate {}: {}", id, e.getReason());
            throw e; // Re-throw to let Spring handle the status code
        } catch (FileNotFoundException e) {
            logger.error("Reanalysis failed for candidate {}: CV file not found.", id, e);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "CV file unavailable: " + e.getMessage(), e);
        } catch (TimeoutException e) {
            logger.error("Reanalysis failed for candidate {}: AI script timeout.", id, e);
            throw new ResponseStatusException(HttpStatus.REQUEST_TIMEOUT, "AI script processing timed out.", e);
        } catch (IOException e) {
            logger.error("Reanalysis failed for candidate {}: IO error during processing.", id, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "IO error during CV analysis.", e);
        } catch (RuntimeException e) { // Catch runtime exceptions from services
            logger.error("Reanalysis failed for candidate {}: Runtime error during processing.", id, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Processing failed: " + e.getMessage(), e);
        } catch (Exception e) { // Catch any other unexpected errors
            logger.error("Unexpected error reanalyzing candidate CV {}", id, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred during reanalysis.", e);
        }
    }

    /**
     * Endpoint to delete a candidate record and their associated CV file.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')") // Typically restricted to Admins
    public ResponseEntity<?> deleteCandidate(@PathVariable String id) {
        logger.info("Request received to delete candidate ID: {}", id);
        return candidatRepository.findById(id)
                .map(candidate -> { // Candidate found
                    String cvPathToDelete = candidate.getCvFilePath();
                    try {
                        // 1. Delete database record
                        candidatRepository.delete(candidate);
                        logger.info("Deleted candidate record with ID: {}", id);

                        // 2. Attempt to delete associated CV file
                        if (cvPathToDelete != null && !cvPathToDelete.isBlank()) {
                            try {
                                deleteCVFile(cvPathToDelete);
                                logger.info("Deleted associated CV file: {}", cvPathToDelete);
                            } catch (IOException e) {
                                // Log warning but proceed, as DB record deletion was the primary goal
                                logger.warn("Candidate record deleted, but failed to delete associated CV file {}: {}", cvPathToDelete, e.getMessage());
                            }
                        }
                        // 3. Return success (No Content)
                        return ResponseEntity.noContent().build();

                    } catch (Exception e) {
                        // Handle errors during database deletion
                        logger.error("Error deleting candidate {} from database: {}", id, e.getMessage(), e);
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(Map.of("error", "Failed to delete candidate from database", "details", e.getMessage()));
                    }
                })
                .orElseGet(() -> { // Candidate not found
                    logger.warn("Delete failed: Candidate not found with ID: {}", id);
                    return ResponseEntity.notFound().build();
                });
    }

    /**
     * Endpoint (for Admin use) to check if the Python environment seems configured correctly.
     */
    @GetMapping("/python-check")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> checkPythonEnvironment() {
        logger.info("Request received for python-check");
        Map<String, Object> response = new HashMap<>();
        try {
            boolean isReady = aiService.verifyPythonEnvironment();
            response.put("pythonEnvironmentReady", isReady);
            response.put("message", isReady ? "Python executable found and executed successfully." : "Python executable not found or failed to execute '--version'. Check logs and environment configuration (PATH, script path).");
            logger.info("Python environment check result: ready={}", isReady);
            return ResponseEntity.ok(response); // Always return OK, the payload indicates the status
        } catch (Exception e) {
            logger.error("Error during Python environment check", e);
            response.put("pythonEnvironmentReady", false);
            response.put("message", "An error occurred while checking the Python environment.");
            response.put("error_details", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }


    // ========================================================================
    // Private Helper Methods
    // ========================================================================

    /**
     * Orchestrates the AI analysis and score calculation for a candidate against a job posting.
     * Updates the candidate object in place. Consolidates the two steps.
     *
     * @param candidate  The candidate object to process.
     * @param jobPosting The job posting context.
     * @throws Exception If any step (AI analysis, scoring) fails.
     */
    private void processCandidateCVAndScore(candidat candidate, Candidature jobPosting) throws Exception {
        logger.info("Starting CV analysis and scoring for candidate {} against job {}", candidate.getId(), jobPosting.getId());
        try {
            // Step 1: Run AI analysis (updates candidate with matched/missing skills, AI score, strengths, weaknesses)
            aiService.analyzeCvAgainstSkills(candidate, jobPosting);
            logger.info("AI analysis complete for candidate {}.", candidate.getId());

            // Step 2: Calculate weighted score based on AI results and job requirements
            scoreCalculationService.calculateScore(candidate, jobPosting);
            logger.info("Score calculation complete for candidate {}. Final Score: {}, Accepted: {}",
                    candidate.getId(), candidate.getScore(), candidate.getAccepted());
        } catch (Exception e) {
            logger.error("Error during CV processing/scoring for candidate {}: {}", candidate.getId(), e.getMessage(), e);
            throw e; // Re-throw the exception to be handled by the calling endpoint method
        }
    }

    /**
     * Saves the uploaded MultipartFile (CV) to the configured upload directory.
     * Generates a unique filename to prevent collisions.
     *
     * @param file The uploaded CV file.
     * @return The absolute path to the saved file as a String.
     * @throws IOException If the file is empty or saving fails.
     */
    private String saveCVFile(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IOException("Cannot save empty file.");
        }
        // Sanitize original filename and get base name
        String originalFilename = file.getOriginalFilename();
        String sanitizedBaseFilename = originalFilename != null ?
                Paths.get(originalFilename).getFileName().toString().replaceAll("[^a-zA-Z0-9.\\-]", "_") : "cv.bin";

        // Ensure filename is not excessively long (adjust limit as needed)
        int maxLength = 100;
        if (sanitizedBaseFilename.length() > maxLength) {
            String extension = getFileExtension(sanitizedBaseFilename);
            String namePart = sanitizedBaseFilename.substring(0, maxLength - extension.length());
            sanitizedBaseFilename = namePart + extension;
        }

        // Create unique filename
        String uniqueFilename = UUID.randomUUID().toString() + "_" + sanitizedBaseFilename;
        Path destinationFile = this.uploadPath.resolve(uniqueFilename).normalize();

        // Ensure the target directory exists (belt-and-suspenders check)
        Files.createDirectories(destinationFile.getParent());

        // Copy file using try-with-resources for input stream
        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
            logger.debug("Successfully saved file to {}", destinationFile);
            return destinationFile.toString();
        } catch (IOException e) {
            logger.error("Failed to save file to {}: {}", destinationFile, e.getMessage(), e);
            throw e; // Re-throw the exception
        }
    }

    /**
     * Deletes a file if the provided path is not null or blank.
     * Logs warnings if deletion fails but does not throw an exception upwards by default
     * (can be modified if deletion failure should halt operations).
     *
     * @param filePathString The absolute path to the file to delete.
     * @throws IOException If deletion fails due to file system issues (permissions etc.)
     */
    private void deleteCVFile(String filePathString) throws IOException {
        if (filePathString != null && !filePathString.isBlank()) {
            Path filePath = Paths.get(filePathString);
            try {
                boolean deleted = Files.deleteIfExists(filePath);
                if (deleted) {
                    logger.debug("Deleted file: {}", filePathString);
                } else {
                    // This is not necessarily an error, file might have already been deleted
                    logger.warn("Attempted to delete file, but it did not exist: {}", filePathString);
                }
            } catch (NoSuchFileException e) {
                logger.warn("Attempted to delete non-existent file: {}", filePathString);
            } catch (DirectoryNotEmptyException e) {
                logger.error("Failed to delete file - path is a non-empty directory: {}", filePathString, e);
                throw e; // Re-throw this as it's unexpected
            } catch (IOException e) {
                logger.error("Failed to delete file {}: {}", filePathString, e.getMessage(), e);
                throw e; // Re-throw IO exceptions (permissions etc.)
            }
        } else {
            logger.debug("Skipped deleting CV file - path was null or blank.");
        }
    }

    /**
     * Creates the upload directory specified by uploadPath if it doesn't exist.
     * Logs an error if creation fails, as this is critical for functionality.
     */
    private void createUploadDir() {
        try {
            Files.createDirectories(uploadPath);
            logger.info("Upload directory verified/created: {}", uploadPath);
        } catch (IOException e) {
            // This is a critical failure - log loudly!
            logger.error("CRITICAL: Could not create upload directory: {}. File uploads will fail.", uploadPath, e);
            // Depending on application requirements, consider throwing a RuntimeException
            // to prevent the application from starting in a broken state.
            // throw new RuntimeException("Could not create upload directory: " + uploadPath, e);
        }
    }

    /**
     * Builds a new `candidat` entity object from request parameters and the saved CV path.
     * Initializes default scores and associates with the job posting.
     */
    private candidat buildCandidate(String nom, String prenom, Integer age,
                                    String email, String numTel,
                                    String cvPath, Candidature jobPosting) {
        candidat candidate = new candidat();
        candidate.setNom(nom);
        candidate.setPrenom(prenom);
        candidate.setAge(age);
        candidate.setEmail(email);
        candidate.setNumTel(numTel);
        candidate.setCvFilePath(cvPath);
        candidate.setDateCandidature(new Date()); // Set application date to now

        // Associate with the job posting
        if (jobPosting != null) {
            // Depending on your JPA/Mongo setup, you might store the full object,
            // or just a reference (like the ID) if lazy loading handles it.
            // Storing the full object reference here for simplicity assuming @DBRef handles it.
            candidate.setCandidatures(new ArrayList<>(Collections.singletonList(jobPosting)));
        } else {
            candidate.setCandidatures(new ArrayList<>()); // Ensure list is initialized
        }

        // Initialize AI/Score fields to default values
        initDefaultSkillsAndScores(candidate);
        return candidate;
    }

    /**
     * Initializes score-related and AI-related fields in a candidate object to default values.
     * Prevents NullPointerExceptions later.
     */
    private void initDefaultSkillsAndScores(candidat candidate) {
        // Initialize lists to avoid NullPointerExceptions
        candidate.setMatchedSkills(new ArrayList<>());
        candidate.setMissingSkills(new ArrayList<>());

        // Set calculated scores to default
        candidate.setScore(0.0);
        candidate.setMatchPercentage(0.0);
        candidate.setAccepted(false); // Default to not accepted
    }

    /**
     * Updates fields of an existing `candidat` entity based on non-null values from a `CandidatUpdateRequest`.
     */
    private void updateCandidateFields(candidat existing, CandidatUpdateRequest update) {
        // Use Optional and filter to update only if the request field is provided and not blank
        Optional.ofNullable(update.getNom()).filter(s -> !s.isBlank()).ifPresent(existing::setNom);
        Optional.ofNullable(update.getPrenom()).filter(s -> !s.isBlank()).ifPresent(existing::setPrenom);
        Optional.ofNullable(update.getAge()).ifPresent(existing::setAge); // Allow setting age to null? Decide policy.
        Optional.ofNullable(update.getEmail()).filter(s -> !s.isBlank()).ifPresent(existing::setEmail);
        Optional.ofNullable(update.getNumTel()).filter(s -> !s.isBlank()).ifPresent(existing::setNumTel);
        logger.debug("Updated candidate {} fields based on request.", existing.getId());
    }

    /**
     * Maps a `candidat` entity object to a `CandidatResponse` DTO suitable for sending to clients.
     * Excludes sensitive or unnecessary information like the full CV path by default.
     */
    private CandidatResponse toResponseDTO(candidat candidate) {
        if (candidate == null) return null;

        CandidatResponse dto = new CandidatResponse();
        dto.setId(candidate.getId());
        dto.setNom(candidate.getNom());
        dto.setPrenom(candidate.getPrenom());
        dto.setAge(candidate.getAge());
        dto.setEmail(candidate.getEmail());
        dto.setNumTel(candidate.getNumTel());
        // dto.setCvFilePath(candidate.getCvFilePath()); // Usually exclude full path from general responses
        dto.setDateCandidature(candidate.getDateCandidature());
        // Ensure lists are copied to avoid issues if the source list is modified later
        dto.setMatchedSkills(candidate.getMatchedSkills() != null ? new ArrayList<>(candidate.getMatchedSkills()) : new ArrayList<>());
        dto.setMissingSkills(candidate.getMissingSkills() != null ? new ArrayList<>(candidate.getMissingSkills()) : new ArrayList<>());
        dto.setScore(candidate.getScore());
        dto.setMatchPercentage(candidate.getMatchPercentage());
        dto.setAccepted(candidate.getAccepted());

        // Map associated job postings to a simpler DTO (e.g., just IDs or basic info)
        if (candidate.getCandidatures() != null) {
            dto.setCandidaturesInfo(candidate.getCandidatures().stream()
                    .filter(Objects::nonNull) // Filter out potential nulls in the list
                    .map(c -> new CandidatureBasicInfo(c.getId(), c.getService())) // Map to basic info DTO
                    .collect(Collectors.toList()));
        } else {
            dto.setCandidaturesInfo(new ArrayList<>()); // Ensure list is initialized
        }
        // Note: totalCandidates field is set specifically in getCandidatesByPosition method

        return dto;
    }

    /**
     * Extracts the file extension from a filename string.
     *
     * @param filename The filename.
     * @return The extension (including the dot), or an empty string if no extension is found.
     */
    private String getFileExtension(String filename) {
        if (filename == null) {
            return "";
        }
        int lastDot = filename.lastIndexOf('.');
        return (lastDot == -1 || lastDot == filename.length() - 1) ? "" : filename.substring(lastDot);
    }


    // ========================================================================
    // Static Inner Classes for Request/Response DTOs
    // ========================================================================

    /**
     * DTO for receiving updates to a candidate's basic information via the PUT endpoint.
     */
    public static class CandidatUpdateRequest {
        private String nom;
        private String prenom;
        private String email;
        private String numTel;
        private Integer age;

        // Standard Getters and Setters...
        public String getNom() { return nom; }
        public void setNom(String nom) { this.nom = nom; }
        public String getPrenom() { return prenom; }
        public void setPrenom(String prenom) { this.prenom = prenom; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getNumTel() { return numTel; }
        public void setNumTel(String numTel) { this.numTel = numTel; }
        public Integer getAge() { return age; }
        public void setAge(Integer age) { this.age = age; }
    }

    /**
     * DTO for sending candidate information back to the client in API responses.
     * Selectively includes fields suitable for display.
     */
    public static class CandidatResponse {
        private String id;
        private String nom;
        private String prenom;
        private String email;
        private String numTel;
        // private String cvFilePath; // Usually excluded
        private Integer age;
        private Date dateCandidature;
        private List<String> matchedSkills;
        private List<String> missingSkills;
        private Double score; // Final calculated score (0-10)
        private Double matchPercentage; // Weighted match percentage (0-100)
        private Boolean accepted; // Based on threshold
        private List<CandidatureBasicInfo> candidaturesInfo; // List of associated jobs (basic info)
        private Long totalCandidates; // Populated only in specific list endpoints like getCandidatesByPosition

        // Standard Getters and Setters...
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getNom() { return nom; }
        public void setNom(String nom) { this.nom = nom; }
        public String getPrenom() { return prenom; }
        public void setPrenom(String prenom) { this.prenom = prenom; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getNumTel() { return numTel; }
        public void setNumTel(String numTel) { this.numTel = numTel; }
        public Integer getAge() { return age; }
        public void setAge(Integer age) { this.age = age; }
        public Date getDateCandidature() { return dateCandidature; }
        public void setDateCandidature(Date dateCandidature) { this.dateCandidature = dateCandidature; }
        public List<String> getMatchedSkills() { return matchedSkills; }
        public void setMatchedSkills(List<String> matchedSkills) { this.matchedSkills = matchedSkills; }
        public List<String> getMissingSkills() { return missingSkills; }
        public void setMissingSkills(List<String> missingSkills) { this.missingSkills = missingSkills; }
        public Double getScore() { return score; }
        public void setScore(Double score) { this.score = score; }
        public Double getMatchPercentage() { return matchPercentage; }
        public void setMatchPercentage(Double matchPercentage) { this.matchPercentage = matchPercentage; }
        public Boolean getAccepted() { return accepted; }
        public void setAccepted(Boolean accepted) { this.accepted = accepted; }
        public List<CandidatureBasicInfo> getCandidaturesInfo() { return candidaturesInfo; }
        public void setCandidaturesInfo(List<CandidatureBasicInfo> candidaturesInfo) { this.candidaturesInfo = candidaturesInfo; }
        public Long getTotalCandidates() { return totalCandidates; }
        public void setTotalCandidates(Long totalCandidates) { this.totalCandidates = totalCandidates; }
    }

    /**
     * Simple DTO to represent basic identifying information about a job posting (Candidature),
     * suitable for including in the `CandidatResponse`.
     */
    public static class CandidatureBasicInfo {
        private String id;
        private String service; // Example: Department or title associated with the job

        public CandidatureBasicInfo(String id, String service) {
            this.id = id;
            this.service = service;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getService() { return service; }
        public void setService(String service) { this.service = service; }
    }
}