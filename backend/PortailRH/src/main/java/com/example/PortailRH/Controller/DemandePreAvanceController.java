package com.example.PortailRH.Controller;

import com.example.PortailRH.Exception.MontantDepasseException;
import com.example.PortailRH.Model.*;
import com.example.PortailRH.Repository.DemandePreAvanceRepository;
import com.example.PortailRH.Repository.FichierJointRepository;
import com.example.PortailRH.Repository.PersonnelRepository;
import com.example.PortailRH.Repository.ServiceRepository;
import com.example.PortailRH.Service.FichierJointService;
import com.example.PortailRH.Service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/demande-pre-avance")
public class DemandePreAvanceController {
    private static final Logger logger = LoggerFactory.getLogger(DemandePreAvanceController.class);

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
                    Personnel chefHierarchique = servicePersonnel.getChef1();

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

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDemandePreAvance(
            @PathVariable String id,
            @RequestBody Map<String, Object> demandeData) {

        return demandePreAvanceRepository.findById(id)
                .map(existingDemande -> {
                    try {
                        boolean isModified = false;
                        // Preserve existing references
                        Personnel existingMatPers = existingDemande.getMatPers();
                        Collection<Fichier_joint> existingFiles = existingDemande.getFiles();

                        // Update type if provided
                        if (demandeData.containsKey("type")) {
                            String newType = (String) demandeData.get("type");
                            if (!DemandePreAvance.getTypesPreAvance().containsKey(newType)) {
                                return ResponseEntity.badRequest().body("Type de pré-avance non valide");
                            }
                            existingDemande.setType(newType);
                            isModified = true;
                        }

                        // Update amount if provided
                        if (demandeData.containsKey("montant")) {
                            try {
                                double montant = Double.parseDouble(demandeData.get("montant").toString());
                                existingDemande.setMontant(montant);
                                isModified = true;
                            } catch (NumberFormatException e) {
                                return ResponseEntity.badRequest().body("Montant doit être un nombre valide");
                            } catch (MontantDepasseException e) {
                                return ResponseEntity.badRequest().body(e.getMessage());
                            }
                        }

                        // Update text if provided
                        if (demandeData.containsKey("texteDemande")) {
                            existingDemande.setTexteDemande((String) demandeData.get("texteDemande"));
                            isModified = true;
                        }

                        // Handle personnel reference
                        if (demandeData.containsKey("matPers")) {
                            Object matPersData = demandeData.get("matPers");
                            if (matPersData instanceof Map) {
                                Map<String, String> matPersMap = (Map<String, String>) matPersData;
                                Optional<Personnel> personnel = personnelRepository.findById(matPersMap.get("id"));
                                personnel.ifPresent(existingDemande::setMatPers);
                                isModified = true;
                            }
                        } else {
                            existingDemande.setMatPers(existingMatPers);
                        }

                        // Reset status if content was modified
                        if (isModified &&
                                (existingDemande.getReponseChef() != Reponse.I ||
                                        existingDemande.getReponseRH() != Reponse.I)) {
                            existingDemande.setReponseChef(Reponse.I);
                            existingDemande.setReponseRH(Reponse.I);
                        }

                        DemandePreAvance updatedDemande = demandePreAvanceRepository.save(existingDemande);

                        // Send notification
                        notificationService.createNotification(
                                updatedDemande.getMatPers().getId(),
                                "Votre demande de pré-avance a été mise à jour",
                                "/demande-pre-avance/" + updatedDemande.getId()
                        );

                        return ResponseEntity.ok(Map.of(
                                "message", "Demande de pré-avance mise à jour avec succès",
                                "demandeId", updatedDemande.getId(),
                                "type", updatedDemande.getType(),
                                "montant", updatedDemande.getMontant(),
                                "texteDemande", updatedDemande.getTexteDemande(),
                                "status", isModified ? "En attente" : "Non modifié"
                        ));
                    } catch (Exception e) {
                        logger.error("Error updating demande pre-avance", e);
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body("Error updating demande: " + e.getMessage());
                    }
                })
                .orElse(ResponseEntity.notFound().build());
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
            @RequestBody(required = false) Map<String, String> request) {

        return demandePreAvanceRepository.findById(id).map(demande -> {
            demande.setReponseChef(Reponse.O);
            demandePreAvanceRepository.save(demande);

            // Get the collaborateur ID from the associated Personnel object
            Personnel collaborateur = demande.getMatPers();
            if (collaborateur == null) {
                return ResponseEntity.badRequest().body("Aucun collaborateur associé à cette demande");
            }

            String collaborateurId = collaborateur.getId();
            String message = "Votre demande de Autorisation a été validée.";
            String role = "collaborateur"; // Make sure this matches your role naming convention

            // Create and send the notification
            notificationService.createNotification(message, role, collaborateurId);

            return ResponseEntity.ok("Demande validée avec succès");

        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/refuser/{id}")
    public ResponseEntity<?> refuserDemande(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {

        if (!request.containsKey("observation")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Observation is required"));
        }

        return demandePreAvanceRepository.findById(id).map(demande -> {
            demande.setReponseChef(Reponse.N);
            demande.setObservation(request.get("observation"));

            demandePreAvanceRepository.save(demande);

            // Get the collaborateur ID from the associated Personnel object
            Personnel collaborateur = demande.getMatPers();
            if (collaborateur == null) {
                return ResponseEntity.badRequest().body("Aucun collaborateur associé à cette demande");
            }

            String collaborateurId = collaborateur.getId();
            String message = "Votre demande de Autorisation a été refusée.";
            String role = "collaborateur"; // Make sure this matches your role naming convention

            // Create and send the notification
            notificationService.createNotification(message, role, collaborateurId);

            return ResponseEntity.ok("Demande refusée avec succès");

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

            // Get the collaborateur ID from the associated Personnel object
            Personnel collaborateur = demande.getMatPers();
            if (collaborateur == null) {
                return ResponseEntity.badRequest().body("Aucun collaborateur associé à cette demande");
            }
            String collaborateurId = collaborateur.getId();
            String message = "Votre demande de Autorisation a été traiter.";
            String role = "collaborateur"; // Make sure this matches your role naming convention

            // Create and send the notification
            notificationService.createNotification(message, role, collaborateurId);

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