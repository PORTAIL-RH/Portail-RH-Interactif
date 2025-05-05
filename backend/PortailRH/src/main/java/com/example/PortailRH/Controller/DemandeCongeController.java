package com.example.PortailRH.Controller;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.example.PortailRH.Model.*;
import com.example.PortailRH.Repository.PersonnelRepository;
import com.example.PortailRH.Repository.ServiceRepository;
import com.example.PortailRH.Service.FichierJointService;
import com.example.PortailRH.Repository.DemandeCongeRepository;
import com.example.PortailRH.Repository.FichierJointRepository;
import com.example.PortailRH.Service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.Year;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/demande-conge")
@Slf4j

public class DemandeCongeController {
    private static final Logger logger = LoggerFactory.getLogger(DemandeCongeController.class);
    @Autowired
    private SseController sseController;
    @Autowired
    private DemandeCongeRepository demandeCongeRepository;
    @Autowired
    private ServiceRepository serviceRepository;
    @Autowired
    private FichierJointRepository fichierJointRepository;

    @Autowired
    private FichierJointService fichierJointService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private PersonnelRepository personnelRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    // 1. Get all demands
    @GetMapping
    public List<DemandeConge> getAllDemandes() {
        return demandeCongeRepository.findAll();
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDemandeConge(@PathVariable String id) {
        try {
            // Check if the demande exists
            Optional<DemandeConge> demandeOpt = demandeCongeRepository.findById(id);
            if (demandeOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            DemandeConge demande = demandeOpt.get();

            // Delete associated files first
            if (demande.getFiles() != null && !demande.getFiles().isEmpty()) {
                fichierJointRepository.deleteAll(demande.getFiles());
            }

            // Then delete the demande
            demandeCongeRepository.deleteById(id);

            // Send SSE notification
            sseController.sendUpdate("deleted", id);

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Demande de formation supprimée avec succès",
                    "deletedId", id
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "status", "error",
                    "message", "Erreur lors de la suppression de la demande de formation",
                    "error", e.getMessage()
            ));
        }
    }
    // 2. Get a demand by ID
    @GetMapping("/{id}")
    public ResponseEntity<DemandeConge> getDemandeById(@PathVariable String id) {
        Optional<DemandeConge> demande = demandeCongeRepository.findById(id);
        return demande.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    // 3. Create a new demand
    @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> createDemandeConge(
            @RequestParam("dateDebut") String dateDebutStr,
            @RequestParam("dateFin") String dateFinStr,
            @RequestParam("texteDemande") String texteDemande,
            @RequestParam("snjTempDep") String snjTempDep,
            @RequestParam("snjTempRetour") String snjTempRetour,
            @RequestParam("codeSoc") String codeSoc,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam("matPersId") String matPersId,
            @RequestParam("nbrJours") String nbrJoursStr) {

        try {
            // 1. Validate user exists
            if (!personnelRepository.existsById(matPersId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "status", "error",
                        "message", "User not found with ID: " + matPersId
                ));
            }

            // 2. Validate and parse dates
            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
            Date dateDebut = dateFormat.parse(dateDebutStr);
            Date dateFin = dateFormat.parse(dateFinStr);

            if (dateDebut.after(dateFin)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "Start date must be before end date"
                ));
            }

            // 3. Validate number of days
            int nbrJours;
            try {
                nbrJours = Integer.parseInt(nbrJoursStr);
                if (nbrJours <= 0) {
                    return ResponseEntity.badRequest().body(Map.of(
                            "status", "error",
                            "message", "Number of days must be positive"
                    ));
                }
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "Invalid number of days format"
                ));
            }

            // 4. Check leave quota (only approved leaves count)
            int currentYear = Year.now().getValue();
            List<DemandeConge> approvedLeaves = demandeCongeRepository.findByMatPersIdAndReponseChefAndYear(
                    matPersId, Reponse.O, currentYear);

            int usedDays = approvedLeaves.stream()
                    .mapToInt(DemandeConge::getNbrJours)
                    .sum();

            if (usedDays + nbrJours > DemandeConge.MAX_DAYS_PER_YEAR) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", String.format("Leave quota exceeded. Used: %d days, Remaining: %d days",
                                usedDays, DemandeConge.MAX_DAYS_PER_YEAR - usedDays),
                        "usedDays", usedDays,
                        "remainingDays", DemandeConge.MAX_DAYS_PER_YEAR - usedDays
                ));
            }

            // 5. Handle file upload if present
            Fichier_joint fichierJoint = null;
            if (file != null && !file.isEmpty()) {
                try {
                    fichierJoint = fichierJointService.saveFile(file);
                } catch (IOException e) {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                            "status", "error",
                            "message", "Failed to process uploaded file"
                    ));
                }
            }

            // 6. Create and save leave request
            DemandeConge demande = new DemandeConge();
            demande.setDateDebut(dateDebut);
            demande.setDateFin(dateFin);
            demande.setTexteDemande(texteDemande);
            demande.setSnjTempDep(snjTempDep);
            demande.setSnjTempRetour(snjTempRetour);
            demande.setTypeDemande("congé");
            demande.setNbrJours(nbrJours);

            Personnel personnel = new Personnel();
            personnel.setId(matPersId);
            personnel.setCode_soc(codeSoc);
            demande.setMatPers(personnel);

            if (fichierJoint != null) {
                demande.setFiles(List.of(fichierJoint));
            }

            DemandeConge savedDemande = demandeCongeRepository.save(demande);

            // 7. Return success response
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "status", "success",
                    "message", "Leave request created successfully",
                    "demandeId", savedDemande.getId(),
                    "remainingDays", DemandeConge.MAX_DAYS_PER_YEAR - (usedDays + nbrJours),
                    "createdAt", new Date()
            ));

        } catch (ParseException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "Invalid date format. Use YYYY-MM-DD"
            ));
        }
    }
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateDemande(
            @PathVariable String id,
            @RequestParam(value = "dateDebut", required = false) String dateDebut,
            @RequestParam(value = "dateFin", required = false) String dateFin,
            @RequestParam(value = "texteDemande", required = false) String texteDemande,
            @RequestParam(value = "snjTempDep", required = false) String snjTempDep,
            @RequestParam(value = "snjTempRetour", required = false) String snjTempRetour,
            @RequestParam(value = "file", required = false) MultipartFile file) {

        return demandeCongeRepository.findById(id).map(existingDemande -> {
            try {
                // Only update allowed fields if they are provided
                if (dateDebut != null) {
                    SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
                    existingDemande.setDateDebut(dateFormat.parse(dateDebut));
                }

                if (dateFin != null) {
                    SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
                    existingDemande.setDateFin(dateFormat.parse(dateFin));
                }

                if (texteDemande != null) {
                    existingDemande.setTexteDemande(texteDemande);
                }

                if (snjTempDep != null) {
                    existingDemande.setSnjTempDep(snjTempDep);
                }

                if (snjTempRetour != null) {
                    existingDemande.setSnjTempRetour(snjTempRetour);
                }

                // Handle file update if provided
                if (file != null && !file.isEmpty()) {
                    // Remove old files if needed
                    if (existingDemande.getFiles() != null && !existingDemande.getFiles().isEmpty()) {
                        fichierJointRepository.deleteAll(existingDemande.getFiles());
                    }

                    // Save new file
                    Fichier_joint fichier = fichierJointService.saveFile(file);
                    existingDemande.setFiles(List.of(fichier));
                }

                // Save and return the updated demande
                DemandeConge updatedDemande = demandeCongeRepository.save(existingDemande);
                return ResponseEntity.ok(Map.of(
                        "message", "Demande mise à jour avec succès",
                        "demandeId", updatedDemande.getId()
                ));

            } catch (ParseException e) {
                return ResponseEntity.badRequest().body("Format de date invalide. Utilisez le format 'yyyy-MM-dd'.");
            } catch (IOException e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Erreur lors du traitement du fichier: " + e.getMessage());
            }
        }).orElse(ResponseEntity.notFound().build());
    }
    @GetMapping("/personnel/{matPersId}")
    public ResponseEntity<List<DemandeConge>> getDemandesByPersonnelId(@PathVariable String matPersId) {
        List<DemandeConge> demandes = demandeCongeRepository.findByMatPersId(matPersId);
        if (demandes.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(demandes);
    }



    @PutMapping("/valider/{id}")
    public ResponseEntity<?> validerDemande(
            @PathVariable String id,
            @RequestBody(required = false) TraitementDemandeRequest request) {

        return demandeCongeRepository.findById(id).map(demande -> {
            demande.setReponseChef(Reponse.O);

            // Set observation if provided in request body (optional for approval)
            if (request != null && request.getObservation() != null && !request.getObservation().trim().isEmpty()) {
                demande.setObservation(request.getObservation().trim());
            } else {
                demande.setObservation(null); // Clear observation if not provided
            }

            DemandeConge updatedDemande = demandeCongeRepository.save(demande);
            sseController.sendUpdate("demande_updated", updatedDemande);

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Demande validée avec succès",
                    "observation", updatedDemande.getObservation() != null ? updatedDemande.getObservation() : ""
            ));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/refuser/{id}")
    public ResponseEntity<?> refuserDemande(
            @PathVariable String id,
            @RequestBody @Valid TraitementDemandeRequest request) {

        // Validation will be handled by @Valid annotation
        return demandeCongeRepository.findById(id).map(demande -> {
            demande.setReponseChef(Reponse.N);
            demande.setObservation(request.getObservation().trim());

            DemandeConge updatedDemande = demandeCongeRepository.save(demande);
            sseController.sendUpdate("demande_updated", updatedDemande);

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Demande refusée avec succès",
                    "observation", updatedDemande.getObservation()
            ));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/traiter/{id}")
    public ResponseEntity<String> traiterDemande(
            @PathVariable String id,
            @RequestParam(value = "observation", required = false) String observation) {
        return demandeCongeRepository.findById(id).map(demande -> {
            demande.setReponseRH(Reponse.T);
            demande.setObservation(observation); // Set observation if provided
            demandeCongeRepository.save(demande);
            return ResponseEntity.ok("Demande traitée avec succès");
        }).orElse(ResponseEntity.notFound().build());
    }
    @GetMapping("/approved")
    public ResponseEntity<List<Map<String, Object>>> getApprovedDemandes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<DemandeConge> approvedDemandes = demandeCongeRepository.findByReponseChef(Reponse.O, pageable);

        List<Map<String, Object>> result = approvedDemandes.stream()
                .map(demande -> {
                    Map<String, Object> demandeMap = new HashMap<>();

                    // Informations de base de la demande
                    demandeMap.put("id", demande.getId_libre_demande());
                    demandeMap.put("dateDemande", demande.getDateDemande());
                    demandeMap.put("typeDemande", demande.getTypeDemande());

                    // Dates et durée du congé
                    demandeMap.put("dateDebut", demande.getDateDebut());
                    demandeMap.put("dateFin", demande.getDateFin());
                    demandeMap.put("nbrJours", demande.getNbrJours());

                    // Informations sur l'employé
                    if (demande.getMatPers() != null) {
                        Personnel employee = demande.getMatPers();
                        Map<String, Object> employeeMap = new HashMap<>();
                        employeeMap.put("id", employee.getId());
                        employeeMap.put("matricule", employee.getMatricule());
                        employeeMap.put("nom", employee.getNom());
                        employeeMap.put("prenom", employee.getPrenom());
                        employeeMap.put("email", employee.getEmail());
                        employeeMap.put("codeSociete", employee.getCode_soc());

                        // Informations du service
                        if (employee.getService() != null) {
                            employeeMap.put("service", employee.getServiceName());
                            employeeMap.put("serviceId", employee.getServiceId());
                        }

                        demandeMap.put("employee", employeeMap);
                    }

                    // Autres informations de la demande
                    demandeMap.put("snjTempDep", demande.getSnjTempDep());
                    demandeMap.put("snjTempRetour", demande.getSnjTempRetour());
                    demandeMap.put("texteDemande", demande.getTexteDemande());
                    demandeMap.put("reponseChef", demande.getReponseChef());
                    demandeMap.put("reponseRH", demande.getReponseRH());

                    // Fichiers joints
                    if (demande.getFiles() != null && !demande.getFiles().isEmpty()) {
                        List<Map<String, Object>> filesList = demande.getFiles().stream()
                                .map(file -> {
                                    Map<String, Object> fileMap = new HashMap<>();
                                    fileMap.put("id", file.getId());
                                    fileMap.put("filename", file.getFilename());
                                    fileMap.put("fileType", file.getFileType());
                                    return fileMap;
                                })
                                .collect(Collectors.toList());
                        demandeMap.put("fichiersJoint", filesList);
                    }

                    return demandeMap;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
    @GetMapping("/personnel/{matPersId}/accepted")
    public ResponseEntity<List<DemandeConge>> getAcceptedDemandesByPersonnelId(@PathVariable String matPersId) {
        List<DemandeConge> demandes = demandeCongeRepository.findByMatPersIdAndReponseChef(matPersId, Reponse.O);
        if (demandes.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(demandes);
    }
    @Autowired
    private MongoTemplate mongoTemplate;


    @GetMapping("/collaborateurs-by-service/{chefserviceid}")
    public ResponseEntity<?> getDemandesCongeByCollaborateursService(@PathVariable String chefserviceid) {
        try {
            // 1. Find service with minimal fields
            Query serviceQuery = new Query();
            serviceQuery.addCriteria(Criteria.where("chefHierarchique.$id").is(new ObjectId(chefserviceid)));
            serviceQuery.fields().include("serviceName");
            Service service = mongoTemplate.findOne(serviceQuery, Service.class);

            if (service == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of(
                                "status", "error",
                                "message", "Aucun service trouvé pour ce chef hiérarchique",
                                "serviceId", chefserviceid
                        ));
            }

            // 2. Find collaborateur IDs only
            Query collabQuery = new Query();
            collabQuery.addCriteria(Criteria.where("service.$id").is(new ObjectId(service.getId()))
                    .and("role").is("collaborateur"));
            collabQuery.fields().include("id");

            List<ObjectId> collaborateurIds = mongoTemplate.find(collabQuery, Personnel.class)
                    .stream()
                    .map(p -> new ObjectId(p.getId()))
                    .collect(Collectors.toList());

            if (collaborateurIds.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "status", "success",
                        "message", "Aucun collaborateur trouvé dans ce service",
                        "service", service.getServiceName(),
                        "demandes", Collections.emptyList()
                ));
            }

            // 3. Get complete demandes with all fields
            Query demandeQuery = new Query();
            demandeQuery.addCriteria(Criteria.where("matPers.$id").in(collaborateurIds));

            List<DemandeConge> demandes = mongoTemplate.find(demandeQuery, DemandeConge.class);

            // 4. Manual conversion with all attributes
            List<Map<String, Object>> result = demandes.stream()
                    .map(d -> {
                        Map<String, Object> map = new HashMap<>();
                        // Basic fields
                        map.put("id_libre_demande", d.getId_libre_demande());
                        map.put("dateDemande", d.getDateDemande());
                        map.put("typeDemande", d.getTypeDemande());
                        map.put("codeSoc", d.getCodeSoc());
                        map.put("dateDebut", d.getDateDebut());
                        map.put("dateFin", d.getDateFin());
                        map.put("snjTempDep", d.getSnjTempDep());
                        map.put("snjTempRetour", d.getSnjTempRetour());
                        map.put("nbrJours", d.getNbrJours());
                        map.put("year", d.getYear());
                        map.put("texteDemande", d.getTexteDemande());
                        map.put("reponseChef", d.getReponseChef());
                        map.put("reponseRH", d.getReponseRH());
                        map.put("observation", d.getObservation());

                        // Handle personnel with cycle protection
                        if (d.getMatPers() != null) {
                            Map<String, Object> personnel = new HashMap<>();
                            personnel.put("id", d.getMatPers().getId());
                            personnel.put("matricule", d.getMatPers().getMatricule());
                            personnel.put("nom", d.getMatPers().getNom());
                            personnel.put("prenom", d.getMatPers().getPrenom());
                            personnel.put("email", d.getMatPers().getEmail());
                            map.put("matPers", personnel);
                        }

                        // Handle files
                        if (d.getFiles() != null) {
                            map.put("files", d.getFiles().stream()
                                    .map(f -> Map.of(
                                            "id", f.getId(),
                                            "fileId", f.getFileId(),

                                            "filename", f.getFilename(),
                                            "fileType", f.getFileType()
                                    ))
                                    .collect(Collectors.toList()));
                        }

                        return map;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "service", service.getServiceName(),
                    "demandes", result
            ));

        } catch (Exception e) {
            log.error("Error fetching leave requests for chef {}: {}", chefserviceid, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "status", "error",
                            "message", "Erreur lors de la récupération des demandes de congé",
                            "error", e.getMessage()
                    ));
        }
    }
    @GetMapping("/days-used/{matPersId}")
    public ResponseEntity<Map<String, Object>> getUsedDaysForCurrentYear(
            @PathVariable String matPersId) {

        // 1. Check if user exists
        if (!personnelRepository.existsById(matPersId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "status", "error",
                    "message", "User not found with ID: " + matPersId
            ));
        }

        try {
            // 2. Get current year
            int currentYear = Year.now().getValue();

            // 3. Find all APPROVED leave requests for this user in current year
            List<DemandeConge> approvedDemandes = demandeCongeRepository
                    .findByMatPersIdAndReponseChefAndYear(matPersId, Reponse.O, currentYear);

            // 4. Calculate total used days
            int totalDaysUsed = approvedDemandes.stream()
                    .mapToInt(DemandeConge::getNbrJours)
                    .sum();

            // 5. Calculate remaining days
            int remainingDays = DemandeConge.MAX_DAYS_PER_YEAR - totalDaysUsed;

            // 6. Return the result
            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "matPersId", matPersId,
                    "year", currentYear,
                    "totalDaysUsed", totalDaysUsed,
                    "remainingDays", remainingDays,
                    "maxDaysPerYear", DemandeConge.MAX_DAYS_PER_YEAR
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "status", "error",
                    "message", "Error calculating leave days",
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/collaborateurs-by-service/{chefserviceid}/approved")
    public ResponseEntity<?> getDemandesCongeApprovedByCollaborateursService(
            @PathVariable String chefserviceid) {
        try {
            // 1. Find the service where this chef is the "Chef Hiérarchique"
            Service service = serviceRepository.findByChefHierarchiqueId(chefserviceid);

            if (service == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of(
                                "message", "Aucun service trouvé pour ce chef hiérarchique",
                                "serviceId", chefserviceid
                        ));
            }

            // 2. Get all personnel with role "collaborateur" in this service
            List<Personnel> collaborateurs = personnelRepository.findByRoleAndService(
                    "collaborateur",
                    service
            );

            if (collaborateurs.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "message", "Aucun collaborateur trouvé dans ce service",
                        "service", service.getServiceName(),
                        "demandes", Collections.emptyList()
                ));
            }

            // 3. Get APPROVED leave requests for these collaborators using MongoTemplate
            List<ObjectId> collaborateurObjectIds = collaborateurs.stream()
                    .map(p -> new ObjectId(p.getId()))
                    .collect(Collectors.toList());

            Query query = new Query();
            query.addCriteria(Criteria.where("matPers.$id").in(collaborateurObjectIds)
                    .and("reponseChef").is("O")); // Only approved demandes

            List<DemandeConge> demandes = mongoTemplate.find(query, DemandeConge.class);

            // Debug output
            System.out.println("Service ID: " + service.getId());
            System.out.println("Collaborateur IDs: " +
                    collaborateurs.stream().map(Personnel::getId).collect(Collectors.toList()));
            System.out.println("Found " + demandes.size() + " demandes de congé approuvées");
            demandes.forEach(d -> System.out.println(
                    "Demande ID: " + d.getId() +
                            " | Personnel: " + (d.getMatPers() != null ? d.getMatPers().getId() : "null") +
                            " | Status: " + d.getReponseChef()
            ));

            return ResponseEntity.ok(Map.of(
                    "service", service.getServiceName(),
                    "totalCollaborateurs", collaborateurs.size(),
                    "totalDemandes", demandes.size(),
                    "demandes", demandes
            ));
        } catch (Exception e) {
            System.err.println("Error fetching approved demandes de congé: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "message", "Erreur lors de la récupération des demandes de congé approuvées",
                            "error", e.getMessage()
                    ));
        }
    }

}