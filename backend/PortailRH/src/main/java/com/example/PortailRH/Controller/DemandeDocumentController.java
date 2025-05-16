package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.DemandeDocument;
import com.example.PortailRH.Model.Fichier_joint;
import com.example.PortailRH.Model.Personnel;
import com.example.PortailRH.Model.Reponse;
import com.example.PortailRH.Repository.DemandeDocumentRepository;
import com.example.PortailRH.Repository.FichierJointRepository;
import com.example.PortailRH.Repository.PersonnelRepository;
import com.example.PortailRH.Repository.ServiceRepository;
import com.example.PortailRH.Service.FichierJointService;
import com.example.PortailRH.Service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/demande-document")
public class DemandeDocumentController {
    private static final Logger logger = LoggerFactory.getLogger(DemandeDocumentController.class);


    @Autowired private DemandeDocumentRepository demandeDocumentRepository;
    @Autowired private FichierJointService fichierJointService;
    @Autowired private NotificationService notificationService;
    @Autowired private SimpMessagingTemplate messagingTemplate;
    @Autowired private PersonnelRepository personnelRepository;
    @Autowired private SseController sseController;
    @Autowired private ServiceRepository serviceRepository;
    @Autowired private FichierJointRepository fichierJointRepository;
    @Autowired private MongoTemplate mongoTemplate;

    // Create new request
    @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createDemande(
            @RequestParam("typeDemande") String typeDemande,
            @RequestParam("codeSoc") String codeSoc,
            @RequestParam("texteDemande") String texteDemande,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam("matPersId") String matPersId,
            @RequestParam("typeDocument") String typeDocument) {

        try {
            DemandeDocument demandeDocument = new DemandeDocument();
            demandeDocument.setTypeDemande(typeDemande);
            demandeDocument.setCodeSoc(codeSoc);
            demandeDocument.setTexteDemande(texteDemande);
            demandeDocument.setTypeDocument(typeDocument);
            demandeDocument.setDateDemande(new Date());

            Personnel personnel = personnelRepository.findById(matPersId)
                    .orElseThrow(() -> new RuntimeException("Personnel not found"));
            demandeDocument.setMatPers(personnel);

            if (file != null && !file.isEmpty()) {
                Fichier_joint fichier = fichierJointService.saveFile(file);
                demandeDocument.setFiles(List.of(fichier));
            }

            // Send notifications
            String notificationMessage = "New request from " + personnel.getNom() + " " + personnel.getPrenom();
            notificationService.createNotification(notificationMessage, "RH", null,personnel.getService().getId(),personnel.getCode_soc());



            DemandeDocument savedDemande = demandeDocumentRepository.save(demandeDocument);
            sseController.sendUpdate("created", savedDemande);

            return ResponseEntity.status(HttpStatus.CREATED).body(savedDemande);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // Get all requests
    @GetMapping
    public ResponseEntity<List<DemandeDocument>> getAllDemandes() {
        return ResponseEntity.ok(demandeDocumentRepository.findAll());
    }

    // Get request by ID
    @GetMapping("/{id}")
    public ResponseEntity<DemandeDocument> getDemandeById(@PathVariable String id) {
        return demandeDocumentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Download file
    @GetMapping("/download/{fileId}")
    public ResponseEntity<InputStreamResource> downloadFile(@PathVariable String fileId) {
        try {
            // 1. Get the file metadata from your collection
            Optional<Fichier_joint> fileMetadataOpt = fichierJointService.getFileMetadata(fileId);

            if (fileMetadataOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Fichier_joint fileMetadata = fileMetadataOpt.get();

            // 2. Get the actual file content from GridFS
            GridFsResource resource = fichierJointService.getFileResource(fileMetadata.getFileId());

            if (resource == null) {
                return ResponseEntity.notFound().build();
            }

            // 3. Prepare the response
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + fileMetadata.getFilename() + "\"")
                    .contentType(MediaType.parseMediaType(fileMetadata.getFileType()))
                    .body(new InputStreamResource(resource.getInputStream()));

        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Add response file to request
    @PostMapping("/{id}/add-response-file")
    public ResponseEntity<?> addResponseFile(
            @PathVariable String id,
            @RequestParam("file") MultipartFile file) {
        try {
            DemandeDocument demande = demandeDocumentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Request not found"));

            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
            }

            Fichier_joint fichier = fichierJointService.saveFile(file);

            if (demande.getFilesReponse() == null) {
                demande.setFilesReponse(new ArrayList<>());
            }

            demande.getFilesReponse().add(fichier);
            demandeDocumentRepository.save(demande);

            return ResponseEntity.ok(fichier);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    // Get all DemandePreAvance records for a specific personnel ID
    @GetMapping("/personnel/{matPersId}")
    public ResponseEntity<List<DemandeDocument>> getDemandesByPersonnelId(@PathVariable String matPersId) {
        List<DemandeDocument> demandes = demandeDocumentRepository.findByMatPersId(matPersId);
        return demandes.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(demandes);
    }
    // Get response files for personnel
    @GetMapping("/personnel/{matPersId}/files-reponse")
    public ResponseEntity<List<Fichier_joint>> getDemandesFilesReponseByMatPersId(@PathVariable String matPersId) {
        try {
            List<DemandeDocument> demandes = demandeDocumentRepository.findByMatPersId(matPersId);
            List<Fichier_joint> filesReponse = new ArrayList<>();

            demandes.stream()
                    .filter(d -> d.getFilesReponse() != null)
                    .forEach(d -> filesReponse.addAll(d.getFilesReponse()));

            return ResponseEntity.ok(filesReponse);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Mettre à jour une demande existante
    @PutMapping("/{id}")
    public ResponseEntity<?> updateDemande(@PathVariable String id, @RequestBody DemandeDocument demandeDetails) {
        try {
            return demandeDocumentRepository.findById(id)
                    .map(existingDemande -> {
                        // Update fields with null checks
                        if (demandeDetails.getTypeDemande() != null) {
                            existingDemande.setTypeDemande(demandeDetails.getTypeDemande());
                        }
                        if (demandeDetails.getTexteDemande() != null) {
                            existingDemande.setTexteDemande(demandeDetails.getTexteDemande());
                        }
                        if (demandeDetails.getReponseChef() != null) {
                            existingDemande.setReponseChef(demandeDetails.getReponseChef());
                        }
                        if (demandeDetails.getReponseRH() != null) {
                            existingDemande.setReponseRH(demandeDetails.getReponseRH());
                        }
                        if (demandeDetails.getTypeDocument() != null) {
                            existingDemande.setTypeDocument(demandeDetails.getTypeDocument());
                        }

                        // ⭐ Automatically update with current date & time ⭐
                        existingDemande.setDateDemande(new Date()); // Sets to current time

                        DemandeDocument updated = demandeDocumentRepository.save(existingDemande);

                        // Send notification
                        notificationService.createNotification(
                                "Demande de formation de personnel %s a été mise à jour",
                                "RH",
                                demandeDetails.getMatPers().getMatricule(),
                                demandeDetails.getMatPers().getServiceId(),
                                demandeDetails.getCodeSoc()
                        );

                        return ResponseEntity.ok(updated);
                    })
                    .orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "error", "Invalid date format",
                            "message", e.getMessage(),
                            "supportedFormats", Arrays.asList(
                                    "yyyy-MM-dd'T'HH:mm:ss.SSSX",
                                    "yyyy-MM-dd",
                                    "dd/MM/yyyy",
                                    "MM/dd/yyyy"
                            )
                    )
            );
        }
    }


    // Approve request
    @PutMapping("/valider/{id}")
    public ResponseEntity<?> validerDemande(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> request) {

        return demandeDocumentRepository.findById(id).map(demande -> {
            demande.setReponseChef(Reponse.O);
            demandeDocumentRepository.save(demande);

            // Get the collaborateur ID from the associated Personnel object
            Personnel collaborateur = demande.getMatPers();
            if (collaborateur == null) {
                return ResponseEntity.badRequest().body("Aucun collaborateur associé à cette demande");
            }

            String collaborateurId = collaborateur.getId();
            String message = "Votre demande de document a été validée.";
           // String role = "collaborateur"; // Make sure this matches your role naming convention

            // Create and send the notification
            notificationService.createNotification(message, null, collaborateurId,null,null);

            return ResponseEntity.ok("Demande validée avec succès");

        }).orElse(ResponseEntity.notFound().build());
    }

    // Reject request
    @PutMapping("/refuser/{id}")
    public ResponseEntity<?> refuserDemande(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {

        if (!request.containsKey("observation")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Observation is required"));
        }

        return demandeDocumentRepository.findById(id).map(demande -> {
            demande.setReponseChef(Reponse.N);
            demande.setObservation(request.get("observation"));

            demandeDocumentRepository.save(demande);

            // Get the collaborateur ID from the associated Personnel object
            Personnel collaborateur = demande.getMatPers();
            if (collaborateur == null) {
                return ResponseEntity.badRequest().body("Aucun collaborateur associé à cette demande");
            }

            String collaborateurId = collaborateur.getId();
            String message = "Votre demande de document a été refusée.";
            //String role = "collaborateur"; // Make sure this matches your role naming convention

            // Create and send the notification
            notificationService.createNotification(message, null, collaborateurId,null,null);

            return ResponseEntity.ok("Demande refusée avec succès");

        }).orElse(ResponseEntity.notFound().build());
    }

    // Process request (RH)
    @PutMapping("/traiter/{id}")
    public ResponseEntity<?> traiterDemande(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> request) {

        return demandeDocumentRepository.findById(id).map(demande -> {
            demande.setReponseRH(Reponse.T);

            if (request != null && request.containsKey("observation")) {
                demande.setObservation(request.get("observation"));
            }

            DemandeDocument updated = demandeDocumentRepository.save(demande);

            // Get the collaborateur ID from the associated Personnel object
            Personnel collaborateur = demande.getMatPers();
            if (collaborateur == null) {
                return ResponseEntity.badRequest().body("Aucun collaborateur associé à cette demande");
            }
            String collaborateurId = collaborateur.getId();
            String message = "Votre demande de Document a été traiter.";
            //String role = "collaborateur"; // Make sure this matches your role naming convention

            // Create and send the notification
            notificationService.createNotification(message, null, collaborateurId,null,null);

            sseController.sendUpdate("updated", updated);

            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    // Get requests by service (for managers)
 /*   @GetMapping("/collaborateurs-by-service/{chefserviceid}")
    public ResponseEntity<?> getDemandesDocumentByCollaborateursService(
            @PathVariable String chefserviceid) {
        try {
            // 1. Validation de l'ID du chef de service
            if (chefserviceid == null || chefserviceid.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "L'ID du chef de service est invalide",
                        "chefServiceId", chefserviceid
                ));
            }

            // 2. Recherche du service lié à ce chef hiérarchique
            Service service = serviceRepository.findByChefHierarchiqueId(chefserviceid);
            if (service == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "status", "error",
                        "message", "Aucun service trouvé pour ce chef hiérarchique",
                        "chefServiceId", chefserviceid
                ));
            }

            // 3. Récupération des collaborateurs de ce service
            List<Personnel> collaborateurs = personnelRepository.findByRoleAndService("collaborateur", service);

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

            // 4. Conversion des IDs collaborateurs en ObjectId
            List<ObjectId> collaborateurObjectIds = collaborateurs.stream()
                    .map(p -> {
                        try {
                            return new ObjectId(p.getId());
                        } catch (IllegalArgumentException e) {
                            throw new RuntimeException("ID de collaborateur invalide : " + p.getId(), e);
                        }
                    })
                    .collect(Collectors.toList());

            // 5. Construction de la requête MongoDB
            Query query = new Query();
            query.addCriteria(Criteria.where("matPers.$id").in(collaborateurObjectIds));

            // 6. Exécution de la requête
            List<DemandeDocument> demandes = mongoTemplate.find(query, DemandeDocument.class);

            // 7. Construction de la réponse
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("service", service.getServiceName());
            response.put("totalCollaborateurs", collaborateurs.size());
            response.put("totalDemandes", demandes.size());
            response.put("demandes", demandes.stream()
                    .map(this::mapDemandeToResponse) // Assure-toi que cette méthode existe
                    .collect(Collectors.toList()));

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            logger.error("Erreur dans getDemandesDocumentByCollaborateursService: " + e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "status", "error",
                    "message", "Erreur lors de la récupération des demandes de document",
                    "error", e.getMessage()
            ));
        }
    }*/


    // Delete request
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDemande(@PathVariable String id) {
        try {
            demandeDocumentRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // Helper method to map DemandeDocument to response DTO
    private Map<String, Object> mapDemandeToResponse(DemandeDocument demande) {
        Map<String, Object> response = new HashMap<>();

        // Map basic fields
        response.put("id", demande.getId());
        response.put("typeDemande", demande.getTypeDemande());
        response.put("dateDemande", demande.getDateDemande());
        response.put("typeDocument", demande.getTypeDocument());
        response.put("texteDemande", demande.getTexteDemande());
        response.put("reponseChef", demande.getReponseChef());
        response.put("reponseRH", demande.getReponseRH());
        response.put("observation", demande.getObservation());

        // Map personnel information
        if (demande.getMatPers() != null) {
            Map<String, Object> personnelInfo = new HashMap<>();
            personnelInfo.put("id", demande.getMatPers().getId());
            personnelInfo.put("nom", demande.getMatPers().getNom());
            personnelInfo.put("prenom", demande.getMatPers().getPrenom());
            personnelInfo.put("matricule", demande.getMatPers().getMatricule());
            response.put("personnel", personnelInfo);
        }

        // Map files information if needed
        if (demande.getFiles() != null && !demande.getFiles().isEmpty()) {
            response.put("fichiers", demande.getFiles().stream()
                    .map(f -> Map.of(
                            "id", f.getId(),
                            "filename", f.getFilename(),
                            "fileType", f.getFileType()
                    ))
                    .collect(Collectors.toList()));
        }

        // Map response files if needed
        if (demande.getFilesReponse() != null && !demande.getFilesReponse().isEmpty()) {
            response.put("fichiersReponse", demande.getFilesReponse().stream()
                    .map(f -> Map.of(
                            "id", f.getId(),
                            "filename", f.getFilename(),
                            "fileType", f.getFileType()
                    ))
                    .collect(Collectors.toList()));
        }

        return response;
    }
}