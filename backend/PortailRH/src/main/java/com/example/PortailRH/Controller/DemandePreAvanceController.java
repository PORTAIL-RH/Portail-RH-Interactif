package com.example.PortailRH.Controller;

import com.example.PortailRH.Exception.MontantDepasseException;
import com.example.PortailRH.Model.*;
import com.example.PortailRH.Repository.DemandePreAvanceRepository;
import com.example.PortailRH.Repository.FichierJointRepository;
import com.example.PortailRH.Repository.PersonnelRepository;
import com.example.PortailRH.Repository.ServiceRepository;
import com.example.PortailRH.Service.FichierJointService;
import com.example.PortailRH.Service.NotificationService;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
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
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/demande-pre-avance")
public class DemandePreAvanceController {

    @Autowired
    private DemandePreAvanceRepository demandePreAvanceRepository;
    @Autowired
    private FichierJointService fichierJointService;
    @Autowired
    private NotificationService notificationService;
    @Autowired
    private ServiceRepository serviceRepository;
    @Autowired
    private SimpMessagingTemplate messagingTemplate; // Inject SimpMessagingTemplate
    @Autowired
    private PersonnelRepository personnelRepository;
    @Autowired
    private SseController sseController;
    @GetMapping
    public List<DemandePreAvance> getAllDemandes() {
        return demandePreAvanceRepository.findAll();
    }
    @Autowired
    private FichierJointRepository fichierJointRepository;
    // Create a new DemandePreAvance
    @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createDemande(
            @RequestParam("type") String type,
            @RequestParam("montant") double montant,
            @RequestParam("texteDemande") String texteDemande,
            @RequestParam("matPersId") String matPersId,
            @RequestParam("codeSoc") String codeSoc,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        try {
            System.out.println("Received matPersId: " + matPersId); // Log matPersId

            // Create a new DemandePreAvance object
            DemandePreAvance demandePreAvance = new DemandePreAvance();
            demandePreAvance.setType(type);
            demandePreAvance.setMontant(montant);
            demandePreAvance.setTexteDemande(texteDemande);
            Personnel matPers = new Personnel();
            matPers.setId(matPersId);
            matPers.setCode_soc(codeSoc);
            demandePreAvance.setMatPers(matPers);
            demandePreAvance.setCodeSoc(codeSoc);
            demandePreAvance.setDateDemande(new Date());

            // Validate the montant
            demandePreAvance.validateMontant();

            // Handle file upload (if provided)
            if (file != null && !file.isEmpty()) {
                // Save the file and get the saved Fichier_joint object
                Fichier_joint fichier = fichierJointService.saveFile(file);

                // Ensure the Fichier_joint object is saved and has a valid ID
                if (fichier.getId() == null) {
                    throw new IllegalStateException("Failed to save the file: Fichier_joint ID is null");
                }

                // Associate the file with the demande
                demandePreAvance.setFiles(List.of(fichier));
            }

            // Send a notification
            // Fetch the personnel details to get the service and chef hiérarchique
            Optional<Personnel> personnelOptional = personnelRepository.findById(matPersId);
            if (personnelOptional.isPresent()) {
                Personnel personnelDetails = personnelOptional.get();
                Service servicePersonnel = personnelDetails.getService();

                // Send a notification to RH
                String notificationMessageRH = "Nouvelle demande d'autorisation ajoutée avec succès par " + personnelDetails.getNom() + " " + personnelDetails.getPrenom();
                notificationService.createNotification(notificationMessageRH, "RH", null);

                // Check if the personnel has a service and if the chef hiérarchique is in the same service
                if (servicePersonnel != null) {
                    Personnel chefHierarchique = servicePersonnel.getChefHierarchique();

                    if (chefHierarchique != null) {
                        // Send a notification to the chef hiérarchique
                        String notificationMessageChef = "Nouvelle demande d'autorisation ajoutée avec succès par " + personnelDetails.getNom() + " " + personnelDetails.getPrenom() + " (Service: " + servicePersonnel.getServiceName() + ")";

                        // Create a notification with role and serviceId
                        notificationService.createNotification(notificationMessageChef, "Chef Hiérarchique", servicePersonnel.getId());
                    } else {
                        System.out.println("Chef Hiérarchique not found for service: " + servicePersonnel.getServiceName());
                    }
                } else {
                    System.out.println("Service not found for personnel: " + personnelDetails.getNom() + " " + personnelDetails.getPrenom());
                }
            }

            // Save the demandePreAvance to the database
            DemandePreAvance savedDemande = demandePreAvanceRepository.save(demandePreAvance);
            sseController.sendUpdate("created", savedDemande);

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Demande de congé créée avec succès",
                    "demandeId", savedDemande.getId()
            ));
        } catch (MontantDepasseException e) {
            return ResponseEntity.badRequest().body(e.getMessage()); // Return 400 Bad Request with the exception message
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur lors de la création de la demande: " + e.getMessage());
        }
    }

    // Get the types of pre-avances and their maximum amounts
    @GetMapping("/types")
    public ResponseEntity<Map<String, Double>> getTypesPreAvance() {
        return ResponseEntity.ok(DemandePreAvance.getTypesPreAvance());
    }

    // Get a DemandePreAvance by ID
    @GetMapping("/{id}")
    public ResponseEntity<DemandePreAvance> getDemandeById(@PathVariable String id) {
        Optional<DemandePreAvance> demande = demandePreAvanceRepository.findById(id);
        return demande.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Update a DemandePreAvance by ID
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateDemande(
            @PathVariable String id,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "montant", required = false) String montantStr,
            @RequestParam(value = "texteDemande", required = false) String texteDemande,
            @RequestParam(value = "file", required = false) MultipartFile file) {

        return demandePreAvanceRepository.findById(id).map(existingDemande -> {
            try {
                boolean isModified = false;

                // Update type if provided and valid
                if (type != null && !type.isEmpty()) {
                    if (!DemandePreAvance.getTypesPreAvance().containsKey(type)) {
                        return ResponseEntity.badRequest().body("Type de pré-avance non valide");
                    }
                    existingDemande.setType(type);
                    isModified = true;
                }

                // Update amount if provided
                if (montantStr != null && !montantStr.isEmpty()) {
                    try {
                        double montant = Double.parseDouble(montantStr);
                        existingDemande.setMontant(montant); // This will validate against type's max amount
                        isModified = true;
                    } catch (NumberFormatException e) {
                        return ResponseEntity.badRequest().body("Montant doit être un nombre valide");
                    } catch (MontantDepasseException e) {
                        return ResponseEntity.badRequest().body(e.getMessage());
                    }
                }

                // Update text if provided
                if (texteDemande != null && !texteDemande.isEmpty()) {
                    existingDemande.setTexteDemande(texteDemande);
                    isModified = true;
                }

                // Handle file upload if provided
                if (file != null && !file.isEmpty()) {
                    // Remove old files if needed
                    if (existingDemande.getFiles() != null && !existingDemande.getFiles().isEmpty()) {
                        fichierJointRepository.deleteAll(existingDemande.getFiles());
                    }

                    // Save new file
                    Fichier_joint newFile = fichierJointService.saveFile(file);
                    existingDemande.getFiles().add(newFile);
                    isModified = true;
                }

                // Reset status if content was modified
                if (isModified &&
                        (existingDemande.getReponseChef() != Reponse.I ||
                                existingDemande.getReponseRH() != Reponse.I)) {
                    existingDemande.setReponseChef(Reponse.I);
                    existingDemande.setReponseRH(Reponse.I);
                }

                // Save the updated demande
                DemandePreAvance updatedDemande = demandePreAvanceRepository.save(existingDemande);

                return ResponseEntity.ok(Map.of(
                        "message", "Demande de pré-avance mise à jour avec succès",
                        "demandeId", updatedDemande.getId(),
                        "type", updatedDemande.getType(),
                        "montant", updatedDemande.getMontant(),
                        "texteDemande", updatedDemande.getTexteDemande(),
                        "status", isModified ? "En attente" : "Non modifié"
                ));

            } catch (IOException e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Erreur lors du traitement du fichier: " + e.getMessage());
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    // Delete a DemandePreAvance by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDemande(@PathVariable String id) {
        if (!demandePreAvanceRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        demandePreAvanceRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // Get all DemandePreAvance records for a specific personnel ID
    @GetMapping("/personnel/{matPersId}")
    public ResponseEntity<List<DemandePreAvance>> getDemandesByPersonnelId(@PathVariable String matPersId) {
        List<DemandePreAvance> demandes = demandePreAvanceRepository.findByMatPers_Id(matPersId);
        return demandes.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(demandes);
    }

    // Validate a DemandePreAvance by ID
    @PutMapping("/valider/{id}")
    public ResponseEntity<?> validerDemande(
            @PathVariable String id,
            @RequestBody(required = false) TraitementDemandeRequest request) {

        return demandePreAvanceRepository.findById(id).map(demande -> {
            demande.setReponseChef(Reponse.O);

            // Set observation if provided in request body (optional for approval)
            if (request != null && request.getObservation() != null && !request.getObservation().trim().isEmpty()) {
                demande.setObservation(request.getObservation().trim());
            } else {
                demande.setObservation(null); // Clear observation if not provided
            }

            DemandePreAvance updatedDemande = demandePreAvanceRepository.save(demande);
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
            @RequestBody TraitementDemandeRequest request) {

        if (request == null || request.getObservation() == null || request.getObservation().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("L'observation est obligatoire pour le rejet");
        }

        return demandePreAvanceRepository.findById(id).map(demande -> {
            try {
                demande.setReponseRH(Reponse.N); // Use 'R' for rejected
                demande.setObservation(request.getObservation().trim());

                DemandePreAvance updatedDemande = demandePreAvanceRepository.save(demande);
                sseController.sendUpdate("updated", updatedDemande);

                // Send notification
                String notificationMessage = "Demande de pré-avance rejetée: " + demande.getId();
                notificationService.createNotification(
                        notificationMessage,
                        "RH",
                        null
                );

                return ResponseEntity.ok(Map.of(
                        "status", "success",
                        "message", "Demande rejetée avec succès",
                        "demande", updatedDemande
                ));
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Erreur lors du rejet de la demande: " + e.getMessage());
            }
        }).orElse(ResponseEntity.notFound().build());
    }


    @PutMapping("/traiter/{id}")
    public ResponseEntity<String> traiterDemande(
            @PathVariable String id,
            @RequestBody(required = false) TraitementDemandeRequest request) {
        return demandePreAvanceRepository.findById(id).map(demande -> {
            demande.setReponseRH(Reponse.T);
            if (request != null && request.getObservation() != null) {
                demande.setObservation(request.getObservation());
            }
            demandePreAvanceRepository.save(demande);
            return ResponseEntity.ok("Demande traitée avec succès");
        }).orElse(ResponseEntity.notFound().build());
    }
    // Helper method to save the uploaded file
    private String saveFile(MultipartFile file) {
        // Implement file saving logic here
        // Example: Save the file to a directory or cloud storage and return the file path
        return "path/to/saved/file";
    }
    @Autowired
    private MongoTemplate mongoTemplate;

    @GetMapping("/collaborateurs-by-service/{chefserviceid}")
    public ResponseEntity<?> getDemandesPreAvanceByCollaborateursService(
            @PathVariable String chefserviceid) {
        try {
            // 1. Find service by chef ID
            Service service = serviceRepository.findByChefHierarchiqueId(chefserviceid);
            if (service == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of(
                                "status", "error",
                                "message", "Aucun service trouvé pour ce chef hiérarchique",
                                "serviceId", chefserviceid
                        ));
            }

            // 2. Get collaborators in this service
            List<Personnel> collaborateurs = personnelRepository.findByRoleAndService(
                    "collaborateur",
                    service
            );

            if (collaborateurs.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "status", "success",
                        "message", "Aucun collaborateur trouvé dans ce service",
                        "service", service.getServiceName(),
                        "totalCollaborateurs", 0,
                        "totalDemandes", 0,
                        "demandes", Collections.emptyList()
                ));
            }

            // 3. Get demandes for these collaborators
            List<ObjectId> collaborateurObjectIds = collaborateurs.stream()
                    .map(p -> new ObjectId(p.getId()))
                    .collect(Collectors.toList());

            Query query = new Query();
            query.addCriteria(Criteria.where("matPers.$id").in(collaborateurObjectIds));

            List<DemandePreAvance> demandes = mongoTemplate.find(query, DemandePreAvance.class);

            // Convert to DTOs
            List<Map<String, Object>> demandeResponses = demandes.stream()
                    .map(demande -> {
                        Map<String, Object> response = new HashMap<>();
                        response.put("id", demande.getId());
                        response.put("type", demande.getType());
                        response.put("montant", demande.getMontant());
                        response.put("status", demande.getReponseChef());
                        // Add other fields as needed
                        return response;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "service", service.getServiceName(),
                    "totalCollaborateurs", collaborateurs.size(),
                    "totalDemandes", demandes.size(),
                    "demandes", demandeResponses
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "status", "error",
                            "message", "Erreur lors de la récupération des demandes de pré-avance",
                            "error", e.getMessage()
                    ));
        }
    }
    // Add these endpoints to DemandePreAvanceController

    @GetMapping("/approved")
    public ResponseEntity<List<DemandePreAvance>> getApprovedDemandes() {
        List<DemandePreAvance> approvedDemandes = demandePreAvanceRepository.findByReponseChef(Reponse.O);
        return ResponseEntity.ok(approvedDemandes);
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<?> getDemandeDetails(@PathVariable String id) {
        Optional<DemandePreAvance> demandeOpt = demandePreAvanceRepository.findById(id);

        if (demandeOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        DemandePreAvance demande = demandeOpt.get();

        Map<String, Object> response = new HashMap<>();
        response.put("id", demande.getId());
        response.put("typeDemande", demande.getTypeDemande());
        response.put("type", demande.getType());
        response.put("dateDemande", demande.getDateDemande());
        response.put("montant", demande.getMontant());
        response.put("maxMontant", DemandePreAvance.getTypesPreAvance().get(demande.getType()));
        response.put("texteDemande", demande.getTexteDemande());
        response.put("reponseChef", demande.getReponseChef());
        response.put("reponseRH", demande.getReponseRH());
        response.put("codeSoc", demande.getCodeSoc());
        response.put("observation", demande.getObservation());
        // Personnel information
        if (demande.getMatPers() != null) {
            Map<String, Object> personnelInfo = new HashMap<>();
            personnelInfo.put("id", demande.getMatPers().getId());
            personnelInfo.put("nom", demande.getMatPers().getNom());
            personnelInfo.put("prenom", demande.getMatPers().getPrenom());
            personnelInfo.put("matricule", demande.getMatPers().getMatricule());
            response.put("personnel", personnelInfo);
        }

        // Files information
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
            response.put("fichiersJoint", filesList);
        }
        return ResponseEntity.ok(response);
    }
}