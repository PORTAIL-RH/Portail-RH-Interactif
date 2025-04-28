package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.Candidature;
import com.example.PortailRH.Model.candidat;
import com.example.PortailRH.Repository.CandidatRepository;
import com.example.PortailRH.Repository.CandidatureRepository;
import com.example.PortailRH.Service.AIService;
import com.example.PortailRH.Service.EmailService;
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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.TimeoutException;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/candidats")
public class CandidatController {
    private static final Logger logger = LoggerFactory.getLogger(CandidatController.class);

    private final CandidatRepository candidatRepository;
    private final CandidatureRepository candidatureRepository;
    private final AIService aiService;
    private final EmailService emailService;
    private final ScoreCalculationService scoreCalculationService;
    private final Path uploadPath;

    @Autowired
    public CandidatController(CandidatRepository candidatRepository,
                              CandidatureRepository candidatureRepository,
                              AIService aiService,
                              EmailService emailService,
                              ScoreCalculationService scoreCalculationService,
                              @Value("${file.upload-dir}") String uploadDir) {
        this.candidatRepository = candidatRepository;
        this.candidatureRepository = candidatureRepository;
        this.aiService = aiService;
        this.emailService = emailService;
        this.scoreCalculationService = scoreCalculationService;
        this.uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        createUploadDir();
    }

    @PostMapping(consumes = {"multipart/form-data"})
    @PreAuthorize("hasRole('CANDIDATE') or hasRole('ADMIN') or hasRole('RECRUITER')")
    public ResponseEntity<?> createCandidate(
            @RequestParam String nom,
            @RequestParam String prenom,
            @RequestParam Integer age,
            @RequestParam String email,
            @RequestParam String numTel,
            @RequestParam String candidatureId,
            @RequestParam("cv") MultipartFile cv) {

        logger.info("Creating candidate: {} {} for candidature ID: {}", nom, prenom, candidatureId);

        if (cv == null || cv.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "CV file is required"));
        }
        if (candidatureId == null || candidatureId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Candidature ID is required"));
        }

        String cvPath = null;
        candidat initialSavedCandidate = null;

        try {
            Candidature jobPosting = candidatureRepository.findById(candidatureId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Job Posting not found"));

            cvPath = saveCVFile(cv);
            candidat candidateToCreate = buildCandidate(nom, prenom, age, email, numTel, cvPath, jobPosting);
            initialSavedCandidate = candidatRepository.save(candidateToCreate);

            try {
                processCandidateCVForSkills(initialSavedCandidate);
                scoreCalculationService.calculateScore(initialSavedCandidate, jobPosting);
                candidat finalCandidate = candidatRepository.save(initialSavedCandidate);
                emailService.sendCandidateConfirmation(finalCandidate);
                return ResponseEntity.status(HttpStatus.CREATED).body(toResponseDTO(finalCandidate));
            } catch (Exception processingException) {
                Map<String, Object> responseBody = new HashMap<>();
                responseBody.put("message", "Candidate created but CV analysis failed");
                responseBody.put("candidate", toResponseDTO(candidatRepository.findById(initialSavedCandidate.getId()).orElse(initialSavedCandidate)));
                responseBody.put("error_details", processingException.getMessage());
                return ResponseEntity.status(HttpStatus.ACCEPTED).body(responseBody);
            }
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(Map.of("error", e.getReason()));
        } catch (IOException e) {
            if (cvPath != null) try { deleteCVFile(cvPath); } catch (IOException cl) { logger.warn("Failed to cleanup CV file"); }
            return ResponseEntity.internalServerError().body(Map.of("error", "File handling error", "details", e.getMessage()));
        } catch (Exception e) {
            if (cvPath != null) try { deleteCVFile(cvPath); } catch (IOException cl) { logger.warn("Failed to cleanup CV file"); }
            return ResponseEntity.internalServerError().body(Map.of("error", "Unexpected error", "details", e.getMessage()));
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAllCandidates(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "dateCandidature,desc") String sort) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("dateCandidature")));
            Page<candidat> candidatePage;

            if (search != null && !search.isBlank()) {
                candidatePage = candidatRepository.findByNomContainingIgnoreCaseOrPrenomContainingIgnoreCase(search, search, pageable);
            } else {
                candidatePage = candidatRepository.findAll(pageable);
            }

            List<CandidatResponse> candidates = candidatePage.getContent()
                    .stream()
                    .map(this::toResponseDTO)
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("candidates", candidates);
            response.put("currentPage", candidatePage.getNumber());
            response.put("totalItems", candidatePage.getTotalElements());
            response.put("totalPages", candidatePage.getTotalPages());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error getting candidates", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN') or @securityService.isOwner(#id)")
    public ResponseEntity<CandidatResponse> getCandidateById(@PathVariable String id) {
        try {
            return candidatRepository.findById(id)
                    .map(c -> ResponseEntity.ok(toResponseDTO(c)))
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Error getting candidate by ID: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{positionId}/candidate-count")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    public ResponseEntity<Long> getCandidateCountForPosition(@PathVariable String positionId) {
        try {
            // Fix: Use the correct query method that matches your repository method
            long count = candidatRepository.countByCandidaturesId(positionId);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            logger.error("Error getting candidate count for position {}", positionId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/by-position/{positionId}")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getCandidatesByPosition(
            @PathVariable String positionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("dateCandidature")));
            Page<candidat> candidatePage = candidatRepository.findByCandidaturesId(positionId, pageable);

            long count = candidatePage.getTotalElements();
            List<CandidatResponse> candidates = candidatePage.getContent()
                    .stream()
                    .map(c -> {
                        CandidatResponse dto = toResponseDTO(c);
                        dto.setTotalCandidates(count);
                        return dto;
                    })
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("candidates", candidates);
            response.put("currentPage", candidatePage.getNumber());
            response.put("totalItems", count);
            response.put("totalPages", candidatePage.getTotalPages());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error getting candidates for position {}", positionId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isOwner(#id)")
    public ResponseEntity<?> updateCandidate(
            @PathVariable String id,
            @RequestBody CandidatUpdateRequest updateRequest) {
        try {
            return candidatRepository.findById(id)
                    .map(candidate -> {
                        updateCandidateFields(candidate, updateRequest);
                        return ResponseEntity.ok(toResponseDTO(candidatRepository.save(candidate)));
                    })
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Error updating candidate {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}/cv")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN') or @securityService.isOwner(#id)")
    public ResponseEntity<Resource> downloadCV(@PathVariable String id) {
        try {
            return candidatRepository.findById(id)
                    .map(candidate -> {
                        if (candidate.getCvFilePath() == null || candidate.getCvFilePath().isBlank()) {
                            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "CV not found");
                        }

                        try {
                            Path filePath = Paths.get(candidate.getCvFilePath()).normalize();
                            Resource resource = new UrlResource(filePath.toUri());

                            if (!resource.exists()) {
                                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "CV file not found");
                            }

                            String contentType = Files.probeContentType(filePath);
                            if (contentType == null) {
                                contentType = "application/octet-stream";
                            }

                            String filename = String.format("%s_%s_CV%s",
                                    candidate.getNom(),
                                    candidate.getPrenom(),
                                    getFileExtension(candidate.getCvFilePath()));

                            return ResponseEntity.ok()
                                    .contentType(MediaType.parseMediaType(contentType))
                                    .header(HttpHeaders.CONTENT_DISPOSITION,
                                            "attachment; filename=\"" + filename + "\"")
                                    .body(resource);
                        } catch (Exception e) {
                            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                                    "Could not download CV: " + e.getMessage());
                        }
                    })
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Candidate not found"));
        } catch (Exception e) {
            logger.error("Error downloading CV for candidate {}", id, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error processing CV download");
        }
    }

    @PostMapping("/{id}/reanalyze")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    public ResponseEntity<?> reanalyzeCandidateCV(@PathVariable String id) {
        try {
            candidat candidate = candidatRepository.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Candidate not found"));

            if (candidate.getCvFilePath() == null || candidate.getCvFilePath().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No CV file associated");
            }

            Path cvFile = Paths.get(candidate.getCvFilePath());
            if (!Files.exists(cvFile)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "CV file not found on disk");
            }

            String relevantCandidatureId = candidate.getCandidatures() != null && !candidate.getCandidatures().isEmpty() ?
                    candidate.getCandidatures().get(0).getId() : null;

            if (relevantCandidatureId == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No associated Job Posting");
            }

            Candidature relevantJobPosting = candidatureRepository.findById(relevantCandidatureId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Associated Job Posting not found"));

            processCandidateCVForSkills(candidate);
            scoreCalculationService.calculateScore(candidate, relevantJobPosting);
            return ResponseEntity.ok(toResponseDTO(candidatRepository.save(candidate)));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (FileNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "CV file unavailable", e);
        } catch (TimeoutException e) {
            throw new ResponseStatusException(HttpStatus.REQUEST_TIMEOUT, "AI script timeout", e);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "IO error", e);
        } catch (Exception e) {
            logger.error("Error reanalyzing candidate CV {}", id, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Processing failed", e);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteCandidate(@PathVariable String id) {
        try {
            return candidatRepository.findById(id)
                    .map(candidate -> {
                        String cvPathToDelete = candidate.getCvFilePath();
                        try {
                            candidatRepository.delete(candidate);
                            if (cvPathToDelete != null && !cvPathToDelete.isBlank()) {
                                try { deleteCVFile(cvPathToDelete); }
                                catch (IOException e) { logger.warn("Failed to delete CV file"); }
                            }
                            return ResponseEntity.noContent().build();
                        } catch (Exception e) {
                            logger.error("Error deleting candidate {}", id, e);
                            return ResponseEntity.internalServerError().body(Map.of("error", "Database error"));
                        }
                    })
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Error deleting candidate {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/python-check")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> checkPythonEnvironment() {
        try {
            boolean isReady = aiService.verifyPythonEnvironment();
            Map<String, Object> response = new HashMap<>();
            response.put("pythonEnvironmentReady", isReady);
            response.put("message", isReady ? "Python ready" : "Python not configured");
            return isReady ? ResponseEntity.ok(response) : ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
        } catch (Exception e) {
            logger.error("Error checking Python environment", e);
            Map<String, Object> response = new HashMap<>();
            response.put("pythonEnvironmentReady", false);
            response.put("message", "Error checking Python environment");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null) {
            return "";
        }
        int lastDot = filename.lastIndexOf('.');
        return lastDot == -1 ? "" : filename.substring(lastDot);
    }

    private void processCandidateCVForSkills(candidat candidate) throws Exception {
        if (candidate.getCvFilePath() == null || !Files.exists(Paths.get(candidate.getCvFilePath()))) {
            throw new FileNotFoundException("CV file missing");
        }
        Map<String, Object> aiResult = aiService.analyseCVWithLlama(candidate.getCvFilePath());
        if (aiResult == null || !"success".equals(aiResult.get("status"))) {
            throw new Exception("AI analysis failed");
        }
        aiService.updateCandidateWithAIResults(candidate, aiResult);
    }

    private void initDefaultSkills(candidat candidate) {
        candidate.setTechnicalSkills(new HashMap<>());
        candidate.setLanguageSkills(new HashMap<>());
        candidate.setStrengths(new ArrayList<>());
        candidate.setWeaknesses(new ArrayList<>());
        candidate.setScore(0.0);
        candidate.setMatchPercentage(0.0);
        candidate.setAccepted(false);
    }

    private String saveCVFile(MultipartFile file) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String sanitizedFilename = originalFilename != null ?
                originalFilename.replaceAll("[^a-zA-Z0-9.\\-]", "_") : "cv.bin";
        String uniqueFilename = UUID.randomUUID() + "_" + sanitizedFilename;
        Path destinationFile = uploadPath.resolve(uniqueFilename).normalize();
        Files.copy(file.getInputStream(), destinationFile, StandardCopyOption.REPLACE_EXISTING);
        return destinationFile.toString();
    }

    private void deleteCVFile(String filePathString) throws IOException {
        if (filePathString != null && !filePathString.isBlank()) {
            Files.deleteIfExists(Paths.get(filePathString));
        }
    }

    private void createUploadDir() {
        try {
            Files.createDirectories(uploadPath);
        } catch (IOException e) {
            logger.error("Failed to create upload directory", e);
        }
    }

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
        candidate.setDateCandidature(new Date());

        if (jobPosting != null) {
            Candidature jobRef = new Candidature();
            jobRef.setId(jobPosting.getId());
            candidate.setCandidatures(new ArrayList<>(Collections.singletonList(jobRef)));
        } else {
            candidate.setCandidatures(new ArrayList<>());
        }

        initDefaultSkills(candidate);
        return candidate;
    }

    private void updateCandidateFields(candidat existing, CandidatUpdateRequest update) {
        Optional.ofNullable(update.getNom()).ifPresent(existing::setNom);
        Optional.ofNullable(update.getPrenom()).ifPresent(existing::setPrenom);
        Optional.ofNullable(update.getAge()).ifPresent(existing::setAge);
        Optional.ofNullable(update.getEmail()).ifPresent(existing::setEmail);
        Optional.ofNullable(update.getNumTel()).ifPresent(existing::setNumTel);
    }

    private CandidatResponse toResponseDTO(candidat candidate) {
        if (candidate == null) return null;
        CandidatResponse dto = new CandidatResponse();
        dto.setId(candidate.getId());
        dto.setNom(candidate.getNom());
        dto.setPrenom(candidate.getPrenom());
        dto.setAge(candidate.getAge());
        dto.setEmail(candidate.getEmail());
        dto.setNumTel(candidate.getNumTel());
        dto.setCvFilePath(candidate.getCvFilePath());
        dto.setDateCandidature(candidate.getDateCandidature());
        dto.setTechnicalSkills(candidate.getTechnicalSkills());
        dto.setLanguageSkills(candidate.getLanguageSkills());
        dto.setStrengths(candidate.getStrengths());
        dto.setWeaknesses(candidate.getWeaknesses());
        dto.setScore(candidate.getScore());
        dto.setMatchPercentage(candidate.getMatchPercentage());
        dto.setAccepted(candidate.getAccepted());
        dto.setCandidatures(candidate.getCandidatures());
        return dto;
    }

    public static class CandidatUpdateRequest {
        private String nom, prenom, email, numTel;
        private Integer age;

        // Getters and setters
        public String getNom() { return nom; }
        public void setNom(String nom) { this.nom = nom; }
        public String getPrenom() { return prenom; }
        public void setPrenom(String prenom) { this.prenom = prenom; }
        public Integer getAge() { return age; }
        public void setAge(Integer age) { this.age = age; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getNumTel() { return numTel; }
        public void setNumTel(String numTel) { this.numTel = numTel; }
    }

    public static class CandidatResponse {
        private String id, nom, prenom, email, numTel, cvFilePath;
        private Integer age;
        private Date dateCandidature;
        private Map<String, Double> technicalSkills, languageSkills;
        private List<String> strengths, weaknesses;
        private Double score, matchPercentage;
        private Boolean accepted;
        private List<Candidature> candidatures;
        private Long totalCandidates;

        // Getters and setters
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getNom() { return nom; }
        public void setNom(String nom) { this.nom = nom; }
        public String getPrenom() { return prenom; }
        public void setPrenom(String prenom) { this.prenom = prenom; }
        public Integer getAge() { return age; }
        public void setAge(Integer age) { this.age = age; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getNumTel() { return numTel; }
        public void setNumTel(String numTel) { this.numTel = numTel; }
        public String getCvFilePath() { return cvFilePath; }
        public void setCvFilePath(String cvFilePath) { this.cvFilePath = cvFilePath; }
        public Date getDateCandidature() { return dateCandidature; }
        public void setDateCandidature(Date dateCandidature) { this.dateCandidature = dateCandidature; }
        public Map<String, Double> getTechnicalSkills() { return technicalSkills; }
        public void setTechnicalSkills(Map<String, Double> technicalSkills) { this.technicalSkills = technicalSkills; }
        public Map<String, Double> getLanguageSkills() { return languageSkills; }
        public void setLanguageSkills(Map<String, Double> languageSkills) { this.languageSkills = languageSkills; }
        public List<String> getStrengths() { return strengths; }
        public void setStrengths(List<String> strengths) { this.strengths = strengths; }
        public List<String> getWeaknesses() { return weaknesses; }
        public void setWeaknesses(List<String> weaknesses) { this.weaknesses = weaknesses; }
        public Double getScore() { return score; }
        public void setScore(Double score) { this.score = score; }
        public Double getMatchPercentage() { return matchPercentage; }
        public void setMatchPercentage(Double matchPercentage) { this.matchPercentage = matchPercentage; }
        public Boolean getAccepted() { return accepted; }
        public void setAccepted(Boolean accepted) { this.accepted = accepted; }
        public List<Candidature> getCandidatures() { return candidatures; }
        public void setCandidatures(List<Candidature> candidatures) { this.candidatures = candidatures; }
        public Long getTotalCandidates() { return totalCandidates; }
        public void setTotalCandidates(Long totalCandidates) { this.totalCandidates = totalCandidates; }
    }
}