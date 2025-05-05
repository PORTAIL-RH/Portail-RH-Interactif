package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.*;
import com.example.PortailRH.Repository.*;
import com.example.PortailRH.Service.DemandeFormationService;
import com.example.PortailRH.Service.FichierJointService;
import com.example.PortailRH.Service.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/demande-formation")
@Slf4j
public class DemandeFormationController {
    private static final Logger logger = LoggerFactory.getLogger(DemandeFormationController.class);

    @Autowired
    private TitreRepository titreRepository;

    @Autowired
    private TypeRepository typeRepository;

    @Autowired
    private ThemeRepository themeRepository;
    @Autowired
    private ServiceRepository serviceRepository;
    @Autowired
    private DemandeFormationService demandeFormationService;
    @Autowired
    private FichierJointRepository fichierJointRepository;
    @Autowired
    private FichierJointService fichierJointService;
    @Autowired
    private DemandeFormationRepository demandeFormationRepository;
    @Autowired
    private NotificationService notificationService;
    @Autowired
    private PersonnelRepository personnelRepository;
    @Autowired
    private SimpMessagingTemplate messagingTemplate; // Inject SimpMessagingTemplate
    @Autowired
    private SseController sseController;
    @GetMapping
    public ResponseEntity<List<DemandeFormation>> getAllDemandes() {
        List<DemandeFormation> demandes = demandeFormationRepository.findAll();
        return ResponseEntity.ok(demandes);
    }
    @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createDemandeFormation(
            @RequestParam("dateDebut") String dateDebut,
            @RequestParam("typeDemande") String typeDemande,
            @RequestParam("texteDemande") String texteDemande,
            @RequestParam("titre") String titreId,
            @RequestParam("type") String typeId,
            @RequestParam("theme") String themeId,
            @RequestParam("annee_f") String annee_f,
            @RequestParam("codeSoc") String codeSoc,
            @RequestParam("nbrJours") String nbrJours,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam("matPersId") String matPersId) {

        try {
            // Validate and parse dates
            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
            Date startDate = dateFormat.parse(dateDebut);

            // Create the demande formation
            DemandeFormation demandeFormation = new DemandeFormation();
            demandeFormation.setDateDebut(startDate);
            demandeFormation.setTypeDemande(typeDemande);
            demandeFormation.setTexteDemande(texteDemande);
            demandeFormation.setCodeSoc(codeSoc);
            demandeFormation.setNbrJours(nbrJours);
            demandeFormation.setAnnee_f(annee_f);

            // Fetch personnel details first
            Personnel matPers = personnelRepository.findById(matPersId)
                    .orElseThrow(() -> new RuntimeException("Personnel non trouvé avec l'ID: " + matPersId));
            demandeFormation.setMatPers(matPers);

            // Set the titre, type, and theme
            titre titre = titreRepository.findById(titreId)
                    .orElseThrow(() -> new RuntimeException("Titre non trouvé"));
            type type = typeRepository.findById(typeId)
                    .orElseThrow(() -> new RuntimeException("Type non trouvé"));
            theme theme = themeRepository.findById(themeId)
                    .orElseThrow(() -> new RuntimeException("Thème non trouvé"));

            demandeFormation.setTitre(titre);
            demandeFormation.setType(type);
            demandeFormation.setTheme(theme);

            // Handle file upload
            if (file != null && !file.isEmpty()) {
                Fichier_joint fichier = fichierJointService.saveFile(file);
                demandeFormation.getFiles().add(fichier);
            }

            // Send notifications
            try {
                Service servicePersonnel = matPers.getService();
                String fullName = matPers.getNom() + " " + matPers.getPrenom();

                // Notification to RH
                String notificationMessageRH = "Nouvelle demande de formation ajoutée par " + fullName;
                notificationService.createNotification(notificationMessageRH, "RH", null);

                // Notification to hierarchical chief if exists
                if (servicePersonnel != null) {
                    Personnel chefHierarchique = servicePersonnel.getChefHierarchique();
                    if (chefHierarchique != null) {
                        String notificationMessageChef = "Nouvelle demande de formation ajoutée par " +
                                fullName + " (Service: " + servicePersonnel.getServiceName() + ")";
                        notificationService.createNotification(notificationMessageChef,
                                "Chef Hiérarchique", servicePersonnel.getId());
                    }
                }
            } catch (Exception e) {
                // Log notification error but don't fail the request
                logger.error("Error sending notifications: " + e.getMessage());
            }

            // Save the request
            DemandeFormation createdDemande = demandeFormationService.createDemandeFormation(demandeFormation);
            sseController.sendUpdate("created", createdDemande);

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Demande de formation créée avec succès",
                    "demandeId", createdDemande.getId_libre_demande()
            ));
        } catch (ParseException e) {
            return new ResponseEntity<>("Format de date invalide.", HttpStatus.BAD_REQUEST);
        } catch (IOException e) {
            return new ResponseEntity<>("Erreur lors du traitement du fichier.", HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Erreur interne du serveur: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/personnel/{matPersId}")
    public ResponseEntity<List<DemandeFormation>> getDemandesFormationByPersonnelId(@PathVariable String matPersId) {
        List<DemandeFormation> demandes = demandeFormationRepository.findByMatPersId(matPersId);
        if (demandes.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(demandes);
    }
    @GetMapping("/personnel/{matPersId}/approved")
    public ResponseEntity<List<DemandeFormation>> getApprovedDemandesFormationByPersonnelId(
            @PathVariable String matPersId) {

        // Find all approved (reponseChef = "O") formations for this user
        List<DemandeFormation> approvedDemandes = demandeFormationRepository.findByMatPersIdAndReponseChef(
                matPersId,
                Reponse.O
        );

        if (approvedDemandes.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(approvedDemandes);
    }

    @PutMapping("/valider/{id}")
    public ResponseEntity<?> validerDemande(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> request) {

        return demandeFormationRepository.findById(id).map(demande -> {
            demande.setReponseChef(Reponse.O);
            demandeFormationRepository.save(demande);

            // Get the collaborateur ID from the associated Personnel object
            Personnel collaborateur = demande.getMatPers();
            if (collaborateur == null) {
                return ResponseEntity.badRequest().body("Aucun collaborateur associé à cette demande");
            }

            String collaborateurId = collaborateur.getId();
            String message = "Votre demande de Formation a été validée.";
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

        return demandeFormationRepository.findById(id).map(demande -> {
            demande.setReponseChef(Reponse.N);
            demande.setObservation(request.get("observation"));

            demandeFormationRepository.save(demande);

            // Get the collaborateur ID from the associated Personnel object
            Personnel collaborateur = demande.getMatPers();
            if (collaborateur == null) {
                return ResponseEntity.badRequest().body("Aucun collaborateur associé à cette demande");
            }

            String collaborateurId = collaborateur.getId();
            String message = "Votre demande de Formation a été refusée.";
            String role = "collaborateur"; // Make sure this matches your role naming convention

            // Create and send the notification
            notificationService.createNotification(message, role, collaborateurId);

            return ResponseEntity.ok("Demande refusée avec succès");

        }).orElse(ResponseEntity.notFound().build());
    }


    @PutMapping("/traiter/{id}")
    public ResponseEntity<?> traiterDemande(
            @PathVariable String id,
            @RequestBody(required = false) TraitementDemandeRequest request) {

        return demandeFormationRepository.findById(id).map(demande -> {
            // Vérifier si la demande est déjà traitée
            if (demande.getReponseRH() != Reponse.I) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "La demande a déjà été traitée"
                ));
            }

            // Traiter la demande (T)
            demande.setReponseRH(Reponse.T);

            // Ajouter une observation si elle est fournie
            if (request != null && request.getObservation() != null && !request.getObservation().trim().isEmpty()) {
                demande.setObservation(request.getObservation().trim());
            } else {
                demande.setObservation(null); // Effacer l'observation si elle n'est pas fournie
            }

            // Sauvegarder la demande mise à jour
            DemandeFormation updatedDemande = demandeFormationRepository.save(demande);

            // Envoyer une mise à jour via SSE
            sseController.sendUpdate("demande_updated", updatedDemande);

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Demande traitée avec succès",
                    "observation", updatedDemande.getObservation() != null ? updatedDemande.getObservation() : ""
            ));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDemandeFormation(@PathVariable String id, @RequestBody Map<String, Object> demandeData) {
        return demandeFormationRepository.findById(id)
                .map(existingDemande -> {
                    try {
                        // Preserve the DBRef fields
                        Personnel existingMatPers = existingDemande.getMatPers();
                        Collection<Fichier_joint> existingFiles = existingDemande.getFiles();
                        titre existingTitre = existingDemande.getTitre();
                        type existingType = existingDemande.getType();
                        theme existingTheme = existingDemande.getTheme();

                        // Update fields from the incoming data
                        if (demandeData.containsKey("typeDemande")) {
                            existingDemande.setTypeDemande((String) demandeData.get("typeDemande"));
                        }

                        // Handle date fields
                        if (demandeData.containsKey("dateDemande")) {
                            existingDemande.setDateDemande(demandeData.get("dateDemande"));
                        }
                        if (demandeData.containsKey("dateDebut")) {
                            existingDemande.setDateDebut(demandeData.get("dateDebut"));
                        }

                        // Handle personnel reference
                        if (demandeData.containsKey("matPers")) {
                            Object matPersData = demandeData.get("matPers");
                            if (matPersData instanceof Map) {
                                Map<String, String> matPersMap = (Map<String, String>) matPersData;
                                Optional<Personnel> personnel = personnelRepository.findById(matPersMap.get("id"));
                                personnel.ifPresent(existingDemande::setMatPers);
                            }
                        } else {
                            existingDemande.setMatPers(existingMatPers);
                        }

                        if (demandeData.containsKey("codeSoc")) {
                            existingDemande.setCodeSoc((String) demandeData.get("codeSoc"));
                        }
                        if (demandeData.containsKey("nbrJours")) {
                            existingDemande.setNbrJours((String) demandeData.get("nbrJours"));
                        }
                        if (demandeData.containsKey("texteDemande")) {
                            existingDemande.setTexteDemande((String) demandeData.get("texteDemande"));
                        }
                        if (demandeData.containsKey("reponseChef")) {
                            existingDemande.setReponseChef(Reponse.valueOf((String) demandeData.get("reponseChef")));
                        }
                        if (demandeData.containsKey("reponseRH")) {
                            existingDemande.setReponseRH(Reponse.valueOf((String) demandeData.get("reponseRH")));
                        }

                        // Handle files
                        if (demandeData.containsKey("Files") && demandeData.get("Files") != null) {
                            // You might need custom logic here to handle file updates
                        } else {
                            existingDemande.setFiles(existingFiles);
                        }

                        // Handle titre reference
                        if (demandeData.containsKey("titre")) {
                            Object titreData = demandeData.get("titre");
                            if (titreData instanceof Map) {
                                Map<String, String> titreMap = (Map<String, String>) titreData;
                                Optional<titre> titre = titreRepository.findById(titreMap.get("id"));
                                titre.ifPresent(existingDemande::setTitre);
                            }
                        } else {
                            existingDemande.setTitre(existingTitre);
                        }

                        // Handle type reference
                        if (demandeData.containsKey("type")) {
                            Object typeData = demandeData.get("type");
                            if (typeData instanceof Map) {
                                Map<String, String> typeMap = (Map<String, String>) typeData;
                                Optional<type> type = typeRepository.findById(typeMap.get("id"));
                                type.ifPresent(existingDemande::setType);
                            }
                        } else {
                            existingDemande.setType(existingType);
                        }

                        // Handle theme reference
                        if (demandeData.containsKey("theme")) {
                            Object themeData = demandeData.get("theme");
                            if (themeData instanceof Map) {
                                Map<String, String> themeMap = (Map<String, String>) themeData;
                                Optional<theme> theme = themeRepository.findById(themeMap.get("id"));
                                theme.ifPresent(existingDemande::setTheme);
                            }
                        } else {
                            existingDemande.setTheme(existingTheme);
                        }

                        if (demandeData.containsKey("annee_f")) {
                            existingDemande.setAnnee_f((String) demandeData.get("annee_f"));
                        }

                        DemandeFormation updatedDemande = demandeFormationRepository.save(existingDemande);

                        // Send notification if status changed
                        if (demandeData.containsKey("reponseChef") || demandeData.containsKey("reponseRH")) {
                            notificationService.createNotification(
                                    updatedDemande.getMatPers().getId(),
                                    "Votre demande de formation a été mise à jour",
                                    "/demande-formation/" + updatedDemande.getId_libre_demande()
                            );
                        }

                        return ResponseEntity.ok(updatedDemande);
                    } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body("Error updating demande: " + e.getMessage());
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }



    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDemandeFormation(@PathVariable String id) {
        try {
            // Check if the demande exists
            Optional<DemandeFormation> demandeOpt = demandeFormationRepository.findById(id);
            if (demandeOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            DemandeFormation demande = demandeOpt.get();

            // Delete associated files first
            if (demande.getFiles() != null && !demande.getFiles().isEmpty()) {
                fichierJointRepository.deleteAll(demande.getFiles());
            }

            // Then delete the demande
            demandeFormationRepository.deleteById(id);

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
    @Autowired
    private MongoTemplate mongoTemplate;


    @GetMapping("/collaborateurs-by-service/{chefserviceid}")
    public ResponseEntity<?> getDemandesFormationByCollaborateursService(
            @PathVariable String chefserviceid) {
        try {
            // 1. Validate chefserviceid
            if (chefserviceid == null || chefserviceid.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "L'ID du chef de service est invalide",
                        "serviceId", chefserviceid
                ));
            }

            // 2. Find only service ID and name (limited fields)
            Query serviceQuery = new Query();
            serviceQuery.addCriteria(Criteria.where("chefHierarchique.$id").is(new ObjectId(chefserviceid)));
            serviceQuery.fields().include("serviceName");
            Service service = mongoTemplate.findOne(serviceQuery, Service.class);

            if (service == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "status", "error",
                        "message", "Aucun service trouvé pour ce chef hiérarchique",
                        "serviceId", chefserviceid
                ));
            }

            // 3. Find collaborateur IDs only (no object graph)
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

            // 4. Get demandes with limited fields
            Query demandeQuery = new Query();
            demandeQuery.addCriteria(Criteria.where("matPers.$id").in(collaborateurIds));

            // Only include necessary fields
            demandeQuery.fields()
                    .include("id_libre_demande")
                    .include("typeDemande")
                    .include("dateDemande")
                    .include("matPers")
                    .include("dateDebut")
                    .include("nbrJours")
                    .include("texteDemande")
                    .include("reponseChef")
                    .include("observation")
                    .include("files")
                    .include("titre")
                    .include("type")
                    .include("theme");

            List<DemandeFormation> demandes = mongoTemplate.find(demandeQuery, DemandeFormation.class);

            // 5. Manual conversion with cycle protection
            List<Map<String, Object>> result = demandes.stream()
                    .map(this::convertDemandeToSafeResponse)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "service", service.getServiceName(),
                    "demandes", result
            ));

        } catch (Exception e) {
            log.error("Error fetching training requests for chef {}: {}", chefserviceid, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "status", "error",
                    "message", "Erreur lors de la récupération des demandes de formation",
                    "error", e.getMessage()
            ));
        }
    }

    private Map<String, Object> convertDemandeToSafeResponse(DemandeFormation demande) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", demande.getId_libre_demande());
        response.put("typeDemande", demande.getTypeDemande());
        response.put("dateDemande", demande.getDateDemande());
        response.put("dateDebut", demande.getDateDebut());
        response.put("nbrJours", demande.getNbrJours());
        response.put("texteDemande", demande.getTexteDemande());
        response.put("reponseChef", demande.getReponseChef());
        response.put("observation", demande.getObservation());

        // Handle personnel safely
        if (demande.getMatPers() != null) {
            Map<String, Object> personnel = new HashMap<>();
            personnel.put("id", demande.getMatPers().getId());
            personnel.put("nom", demande.getMatPers().getNom());
            personnel.put("prenom", demande.getMatPers().getPrenom());
            personnel.put("matricule", demande.getMatPers().getMatricule());
            personnel.put("email", demande.getMatPers().getEmail());
            response.put("personnel", personnel);
        }

        // Handle files safely
        if (demande.getFiles() != null) {
            response.put("files", demande.getFiles().stream()
                    .map(f -> Map.of(
                            "id", f.getId(),
                            "fileId", f.getFileId(),

                            "filename", f.getFilename(),
                            "fileType", f.getFileType()
                    ))
                    .collect(Collectors.toList()));
        }

        // Handle formation details safely
        if (demande.getTitre() != null) {
            response.put("titre", Map.of(
                    "id", demande.getTitre().getId(),
                    "name", demande.getTitre().getTitre()
            ));
        }

        if (demande.getType() != null) {
            response.put("type", Map.of(
                    "id", demande.getType().getId(),
                    "name", demande.getType().getType()
            ));
        }

        if (demande.getTheme() != null) {
            response.put("theme", Map.of(
                    "id", demande.getTheme().getId(),
                    "name", demande.getTheme().getTheme()
            ));
        }

        return response;
    }

    private Map<String, Object> mapDemandeToResponse(DemandeFormation demande) {
        Map<String, Object> demandeMap = new HashMap<>();
        demandeMap.put("id", demande.getId_libre_demande());
        demandeMap.put("typeDemande", demande.getTypeDemande());
        demandeMap.put("dateDemande", demande.getDateDemande());
        demandeMap.put("dateDebut", demande.getDateDebut());
        demandeMap.put("nbrJours", demande.getNbrJours());
        demandeMap.put("texteDemande", demande.getTexteDemande());
        demandeMap.put("reponseChef", demande.getReponseChef());
        demandeMap.put("observation", demande.getObservation());

        // Informations sur le personnel
        if (demande.getMatPers() != null) {
            Map<String, Object> personnelMap = new HashMap<>();
            personnelMap.put("id", demande.getMatPers().getId());
            personnelMap.put("nom", demande.getMatPers().getNom());
            personnelMap.put("prenom", demande.getMatPers().getPrenom());
            personnelMap.put("matricule", demande.getMatPers().getMatricule());
            personnelMap.put("Email", demande.getMatPers().getEmail());

            demandeMap.put("personnel", personnelMap);
        }

        // Fichiers joints
        if (demande.getFiles() != null && !demande.getFiles().isEmpty()) {
            List<Map<String, Object>> fichiersList = demande.getFiles().stream()
                    .map(file -> {
                        Map<String, Object> fileMap = new HashMap<>();
                        fileMap.put("id", file.getId());
                        fileMap.put("filename", file.getFilename());
                        fileMap.put("fileType", file.getFileType());
                        fileMap.put("fileId", file.getFileId());

                        return fileMap;
                    })
                    .collect(Collectors.toList());
            demandeMap.put("files", fichiersList);
        }

        // Détails de la formation
        if (demande.getTitre() != null) {
            demandeMap.put("titre", Map.of(
                    "id", demande.getTitre().getId(),
                    "name", demande.getTitre().getTitre()
            ));
        }

        if (demande.getType() != null) {
            demandeMap.put("type", Map.of(
                    "id", demande.getType().getId(),
                    "name", demande.getType().getType()
            ));
        }

        if (demande.getTheme() != null) {
            demandeMap.put("theme", Map.of(
                    "id", demande.getTheme().getId(),
                    "name", demande.getTheme().getTheme()
            ));
        }

        return demandeMap;
    }




    @GetMapping("/approved")
    public ResponseEntity<List<DemandeFormation>> getApprovedDemandes() {
        List<DemandeFormation> approvedDemandes = demandeFormationRepository.findByReponseChef(Reponse.O);
        return ResponseEntity.ok(approvedDemandes);
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<?> getDemandeDetails(@PathVariable String id) {
        Optional<DemandeFormation> demandeOpt = demandeFormationRepository.findById(id);

        if (demandeOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        DemandeFormation demande = demandeOpt.get();

        Map<String, Object> response = new HashMap<>();
        response.put("id", demande.getId_libre_demande());
        response.put("typeDemande", demande.getTypeDemande());
        response.put("dateDemande", demande.getDateDemande());
        response.put("dateDebut", demande.getDateDebut());
        response.put("nbrJours", demande.getNbrJours());
        response.put("texteDemande", demande.getTexteDemande());
        response.put("reponseChef", demande.getReponseChef());
        response.put("reponseRH", demande.getReponseRH());
        response.put("codeSoc", demande.getCodeSoc());
        response.put("annee_f", demande.getAnnee_f());
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
        // Formation details
        if (demande.getTitre() != null) {
            response.put("titre", Map.of(
                    "id", demande.getTitre().getId(),
                    "name", demande.getTitre().getTitre()
            ));
        }

        if (demande.getType() != null) {
            response.put("type", Map.of(
                    "id", demande.getType().getId(),
                    "name", demande.getType().getType()
            ));
        }

        if (demande.getTheme() != null) {
            response.put("theme", Map.of(
                    "id", demande.getTheme().getId(),
                    "name", demande.getTheme().getTheme()
            ));
        }

        return ResponseEntity.ok(response);
    }
}