package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.*;
import com.example.PortailRH.Repository.DemandeAutorisationRepository;
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

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/demande-autorisation")
public class DemandeAutorisationController {

    @Autowired
    private DemandeAutorisationRepository demandeAutorisationRepository;

    @Autowired
    private FichierJointService fichierJointService;

    @Autowired
    private NotificationService notificationService;
    @Autowired
    private PersonnelRepository personnelRepository;
    @Autowired
    private ServiceRepository serviceRepository;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    @Autowired
    private SseController sseController;
    @Autowired
    private FichierJointRepository fichierJointRepository;

    @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createDemande(
            @RequestParam("dateDebut") String dateDebut,
            @RequestParam("texteDemande") String texteDemande,
            @RequestParam("heureSortie") String heureSortieStr,
            @RequestParam("heureRetour") String heureRetourStr,
            @RequestParam("codAutorisation") String codAutorisation,
            @RequestParam("codeSoc") String codeSoc,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam("matPersId") String matPersId) {

        try {
            // Validate required fields
            if (dateDebut == null || texteDemande == null || heureSortieStr == null || heureRetourStr == null ||
                    codAutorisation == null || codeSoc == null || matPersId == null) {
                return ResponseEntity.badRequest().body("Tous les champs obligatoires doivent être remplis.");
            }

            // Convert date to Date object
            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
            Date startDate = dateFormat.parse(dateDebut);

            // Convert time to LocalTime
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
            LocalTime heureSortie = LocalTime.parse(heureSortieStr, timeFormatter);
            LocalTime heureRetour = LocalTime.parse(heureRetourStr, timeFormatter);

            // Create a new authorization request
            DemandeAutorisation demande = new DemandeAutorisation();
            demande.setDateDebut(startDate);
            demande.setTypeDemande("autorisation");
            demande.setTexteDemande(texteDemande);
            demande.setHoraireSortie(heureSortie.getHour());
            demande.setMinuteSortie(heureSortie.getMinute());
            demande.setHoraireRetour(heureRetour.getHour());
            demande.setMinuteRetour(heureRetour.getMinute());
            demande.setCodAutorisation(codAutorisation);
            demande.setCodeSoc(codeSoc);

            // Associate personnel
            Personnel personnel = new Personnel();
            personnel.setId(matPersId);
            demande.setMatPers(personnel);

            // Handle file upload if present
            if (file != null && !file.isEmpty()) {
                Fichier_joint fichier = fichierJointService.saveFile(file);
                demande.setFiles(List.of(fichier));
            }

            // Save the request
            DemandeAutorisation savedDemande=demandeAutorisationRepository.save(demande);

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

            sseController.sendUpdate("created", savedDemande);

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Demande de AUTORISATION créée avec succès",
                    "demandeId", savedDemande.getId()
            ));
        } catch (ParseException e) {
            return ResponseEntity.badRequest().body("Format de date invalide. Utilisez le format 'yyyy-MM-dd'.");
        } catch (DateTimeParseException e) {
            return ResponseEntity.badRequest().body("Format d'heure invalide. Utilisez le format 'HH:mm'.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Une erreur est survenue : " + e.getMessage());
        }
    }


    @GetMapping
    public ResponseEntity<List<DemandeAutorisation>> getAllDemandes() {
        List<DemandeAutorisation> demandes = demandeAutorisationRepository.findAll();
        return ResponseEntity.ok(demandes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DemandeAutorisation> getDemandeById(@PathVariable String id) {
        Optional<DemandeAutorisation> demande = demandeAutorisationRepository.findById(id);
        return demande.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDemande(
            @PathVariable String id,
            @RequestBody Map<String, Object> requestData) {

        return demandeAutorisationRepository.findById(id).map(existingDemande -> {
            try {
                // Update common fields
                if (requestData.containsKey("texteDemande")) {
                    existingDemande.setTexteDemande((String) requestData.get("texteDemande"));
                }

                // Update date fields
                if (requestData.containsKey("dateDebut")) {
                    existingDemande.setDateDebut(parseDateFromRequest(requestData.get("dateDebut")));
                }

                // Handle time fields conversion
                handleTimeFields(requestData, existingDemande);

                // Save the updated demande
                DemandeAutorisation updatedDemande = demandeAutorisationRepository.save(existingDemande);

                return ResponseEntity.ok(Map.of(
                        "message", "Demande d'autorisation mise à jour avec succès",
                        "demandeId", updatedDemande.getId()
                ));

            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(e.getMessage());
            } catch (Exception e) {
                return ResponseEntity.internalServerError().body("Erreur serveur lors de la mise à jour");
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    private void handleTimeFields(Map<String, Object> requestData, DemandeAutorisation demande) {
        // Heure de sortie
        if (requestData.containsKey("heureSortie")) {
            Object heureSortie = requestData.get("heureSortie");
            if (heureSortie != null) {
                demande.setHeureSortie(parseTimeValue(heureSortie, "heureSortie"));
            }
        }

        // Minute de sortie
        if (requestData.containsKey("minuteSortie")) {
            Object minuteSortie = requestData.get("minuteSortie");
            if (minuteSortie != null) {
                demande.setMinuteSortie(parseTimeValue(minuteSortie, "minuteSortie"));
            }
        }

        // Heure de retour
        if (requestData.containsKey("heureRetour")) {
            Object heureRetour = requestData.get("heureRetour");
            if (heureRetour != null) {
                demande.setHeureRetour(parseTimeValue(heureRetour, "heureRetour"));
            }
        }

        // Minute de retour
        if (requestData.containsKey("minuteRetour")) {
            Object minuteRetour = requestData.get("minuteRetour");
            if (minuteRetour != null) {
                demande.setMinuteRetour(parseTimeValue(minuteRetour, "minuteRetour"));
            }
        }
    }

    private int parseTimeValue(Object value, String fieldName) {
        try {
            if (value instanceof Integer) {
                return (Integer) value;
            } else if (value instanceof String) {
                return Integer.parseInt((String) value);
            } else if (value instanceof Number) {
                return ((Number) value).intValue();
            }
            throw new IllegalArgumentException("Format invalide pour " + fieldName + ": doit être un nombre");
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Format invalide pour " + fieldName + ": doit être un nombre valide");
        }
    }

    private Date parseDateFromRequest(Object dateInput) {
        if (dateInput == null) {
            return null;
        }

        if (dateInput instanceof Date) {
            return (Date) dateInput;
        } else if (dateInput instanceof String) {
            try {
                // Essayez d'abord le format ISO
                return new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSX").parse((String) dateInput);
            } catch (ParseException e1) {
                try {
                    // Essayez le format simple
                    return new SimpleDateFormat("yyyy-MM-dd").parse((String) dateInput);
                } catch (ParseException e2) {
                    throw new IllegalArgumentException("Format de date invalide. Utilisez le format 'yyyy-MM-dd' ou 'yyyy-MM-ddTHH:mm:ss.SSSZ'");
                }
            }
        }
        throw new IllegalArgumentException("Type de date non supporté");
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDemande(@PathVariable String id) {
        if (!demandeAutorisationRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        demandeAutorisationRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/personnel/{matPersId}")
    public ResponseEntity<List<DemandeAutorisation>> getDemandesByPersonnelId(@PathVariable String matPersId) {
        List<DemandeAutorisation> demandes = demandeAutorisationRepository.findByMatPers_Id(matPersId);
        return demandes.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(demandes);
    }


    @PutMapping("/valider/{id}")
    public ResponseEntity<?> validerDemande(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> request) {

        return demandeAutorisationRepository.findById(id).map(demande -> {
            demande.setReponseChef(Reponse.O);
            demandeAutorisationRepository.save(demande);

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

        return demandeAutorisationRepository.findById(id).map(demande -> {
            demande.setReponseChef(Reponse.N);
            demande.setObservation(request.get("observation"));

            demandeAutorisationRepository.save(demande);

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
            @RequestParam(value = "observation", required = false) String observation) {
        return demandeAutorisationRepository.findById(id).map(demande -> {
            demande.setReponseRH(Reponse.T);
            demande.setObservation(observation); // Set observation if provided
            demandeAutorisationRepository.save(demande);
            return ResponseEntity.ok("Demande traitée avec succès");
        }).orElse(ResponseEntity.notFound().build());
    }
    @Autowired
    private MongoTemplate mongoTemplate;

    @GetMapping("/collaborateurs-by-service/{chefserviceid}")
    public ResponseEntity<?> getDemandesByCollaborateursService(@PathVariable String chefserviceid) {
        try {
            // 1. Trouver le service par ID du chef
            Service service = serviceRepository.findByChefHierarchiqueId(chefserviceid);
            if (service == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of(
                                "status", "error",
                                "message", "Aucun service trouvé pour ce chef hiérarchique",
                                "serviceId", chefserviceid
                        ));
            }

            // 2. Obtenir les collaborateurs de ce service
            List<Personnel> collaborateurs = personnelRepository.findByRoleAndService("collaborateur", service);

            if (collaborateurs.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "status", "success",
                        "message", "Aucun collaborateur trouvé dans ce service",
                        "service", service.getServiceName(),
                        "demandes", Collections.emptyList()
                ));
            }

            // 3. Obtenir les demandes pour ces collaborateurs
            List<ObjectId> collaborateurObjectIds = collaborateurs.stream()
                    .map(p -> new ObjectId(p.getId()))
                    .collect(Collectors.toList());

            Query query = new Query();
            query.addCriteria(Criteria.where("matPers.$id").in(collaborateurObjectIds));

            List<DemandeAutorisation> demandes = mongoTemplate.find(query, DemandeAutorisation.class);

            // Conversion en DTOs avec tous les détails, sans inclure les fichiers complets
            List<Map<String, Object>> demandeResponses = demandes.stream()
                    .map(demande -> {
                        Map<String, Object> response = new HashMap<>();
                        response.put("id", demande.getId());
                        response.put("dateDemande", demande.getDateDemande());
                        response.put("matPers", Map.of(
                                "id", demande.getMatPers().getId(),
                                "matricule", demande.getMatPers().getMatricule(),
                                "nomComplet", demande.getMatPers().getNom() + " " + demande.getMatPers().getPrenom()
                        ));
                        response.put("dateDebut", demande.getDateDebut());
                        response.put("texteDemande", demande.getTexteDemande());
                        response.put("observation", demande.getObservation());
                        response.put("reponseChef", demande.getReponseChef());

                        // Only return file metadata (ID, filename, etc.) without the content
                        response.put("files", demande.getFiles().stream()
                                .map(f -> Map.of(
                                        "id", f.getId(),
                                        "filename", f.getFilename(),
                                        "fileId", f.getFileId() // This can be used to fetch file content later
                                ))
                                .collect(Collectors.toList()));

                        response.put("heureSortie", demande.getHeureSortie());
                        response.put("minuteSortie", demande.getMinuteSortie());
                        response.put("heureRetour", demande.getHeureRetour());
                        response.put("minuteRetour", demande.getMinuteRetour());
                        response.put("horaireSortie", demande.getHoraireSortie());
                        response.put("horaireRetour", demande.getHoraireRetour());
                        return response;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "service", service.getServiceName(),
                    "demandes", demandeResponses
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "status", "error",
                            "message", "Erreur lors de la récupération des demandes",
                            "error", e.getMessage()
                    ));
        }
    }


    @GetMapping("/approved")
    public ResponseEntity<List<DemandeAutorisation>> getApprovedDemandes() {
        List<DemandeAutorisation> approvedDemandes = demandeAutorisationRepository.findByReponseChef(Reponse.O);
        return ResponseEntity.ok(approvedDemandes);
    }

    // Enhanced endpoint to get all information of a specific demande
    @GetMapping("/{id}/details")
    public ResponseEntity<?> getDemandeDetails(@PathVariable String id) {
        Optional<DemandeAutorisation> demandeOpt = demandeAutorisationRepository.findById(id);

        if (demandeOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        DemandeAutorisation demande = demandeOpt.get();

        // Create a detailed response DTO
        Map<String, Object> response = new HashMap<>();
        response.put("id", demande.getId());
        response.put("dateDemande", demande.getDateDemande());
        response.put("typeDemande", demande.getTypeDemande());
        response.put("dateDebut", demande.getDateDebut());
        response.put("texteDemande", demande.getTexteDemande());
        response.put("reponseChef", demande.getReponseChef());
        response.put("reponseRH", demande.getReponseRH());
        response.put("codeSoc", demande.getCodeSoc());
        response.put("codAutorisation", demande.getCodAutorisation());
        response.put("observation", demande.getObservation());
        // Format time information
        response.put("heureSortie", String.format("%02d:%02d", demande.getHoraireSortie(), demande.getMinuteSortie()));
        response.put("heureRetour", String.format("%02d:%02d", demande.getHoraireRetour(), demande.getMinuteRetour()));

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