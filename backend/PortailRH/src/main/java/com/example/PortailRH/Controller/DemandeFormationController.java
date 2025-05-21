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
import org.springframework.data.domain.Sort;
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
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/demande-formation")
@Slf4j
public class DemandeFormationController {
    private static final Logger logger = LoggerFactory.getLogger(DemandeFormationController.class);

    @Autowired
    private ValidatorRepository validatorRepository;
    @Autowired
    private ResponseChefsFormationRepository responseChefsRepository;

    @Autowired
    private TitreRepository titreRepository;

    @Autowired
    private ResponseChefsFormationRepository responseChefsFormationRepository;

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
    public ResponseEntity<Map<String, Object>> createDemandeFormation(
            @RequestParam("dateDebut") String dateDebutStr,
            @RequestParam("typeDemande") String typeDemande,
            @RequestParam("texteDemande") String texteDemande,
            @RequestParam("titre") String titreId,
            @RequestParam("type") String typeId,
            @RequestParam("theme") String themeId,
            @RequestParam("annee_f") String annee_f,
            @RequestParam("codeSoc") String codeSoc,
            @RequestParam("nbrJours") String nbrJoursStr,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam("matPersId") String matPersId) {

        try {
            // 1. Validate user exists
            Optional<Personnel> personnelOptional = personnelRepository.findById(matPersId);
            if (personnelOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "status", "error",
                        "message", "User not found with ID: " + matPersId
                ));
            }
            Personnel personnel = personnelOptional.get();

            // 2. Validate date format
            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
            Date dateDebut;
            try {
                dateDebut = dateFormat.parse(dateDebutStr);
            } catch (ParseException e) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "Format de date invalide. Utilisez YYYY-MM-DD"
                ));
            }

            // 3. Validate number of days
            int nbrJours;
            try {
                nbrJours = Integer.parseInt(nbrJoursStr);
                if (nbrJours <= 0) {
                    return ResponseEntity.badRequest().body(Map.of(
                            "status", "error",
                            "message", "Le nombre de jours doit être positif"
                    ));
                }
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "Nombre de jours invalide"
                ));
            }

            // 4. Handle file upload
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

            // 5. Fetch related entities
            com.example.PortailRH.Model.titre titre = titreRepository.findById(titreId)
                    .orElseThrow(() -> new RuntimeException("Titre not found with ID: " + titreId));
            com.example.PortailRH.Model.type type = typeRepository.findById(typeId)
                    .orElseThrow(() -> new RuntimeException("Type not found with ID: " + typeId));
            com.example.PortailRH.Model.theme theme = themeRepository.findById(themeId)
                    .orElseThrow(() -> new RuntimeException("Theme not found with ID: " + themeId));

            // 6. Create and save chefs' responses first
            Response_chefs_dem_formation responseChefs = new Response_chefs_dem_formation();
            responseChefs.setResponseChef1("I");
            responseChefs.setResponseChef2("I");
            responseChefs.setResponseChef3("I");
            responseChefs.setObservationChef1("");
            responseChefs.setObservationChef2("");
            responseChefs.setObservationChef3("");
            responseChefs.setDateChef1("");
            responseChefs.setDateChef2("");
            responseChefs.setDateChef3("");

            Response_chefs_dem_formation savedResponse = responseChefsRepository.save(responseChefs);

            // 7. Create and save formation request
            DemandeFormation demande = new DemandeFormation();
            demande.setDateDebut(dateDebutStr);
            demande.setTypeDemande(typeDemande);
            demande.setTexteDemande(texteDemande);
            demande.setTitre(titre);
            demande.setType(type);
            demande.setTheme(theme);
            demande.setAnnee_f(annee_f);
            demande.setCodeSoc(codeSoc);
            demande.setNbrJours(String.valueOf(nbrJours));
            demande.setMatPers(personnel);
            demande.setReponseChef(Reponse.I);
            demande.setReponseRH(Reponse.I);
            demande.setResponseChefs(savedResponse); // Set the response reference

            if (fichierJoint != null) {
                demande.setFiles(List.of(fichierJoint));
            }

            DemandeFormation savedDemande = demandeFormationRepository.save(demande);

            // 8. Update response with demande ID
            savedResponse.setDemandeId(savedDemande.getId());
            responseChefsRepository.save(savedResponse);

            // 9. Send notifications
            Service service = personnel.getService();
            String notificationMessage = String.format(
                    "Nouvelle demande de formation de %s %s (%s jours)",
                    personnel.getNom(), personnel.getPrenom(), nbrJoursStr
            );

            notificationService.createNotification(notificationMessage, "RH", null);

            if (service != null && service.getChef1() != null) {
                notificationService.createNotification(
                        notificationMessage + " - Service: " + service.getServiceName(),
                        "Chef Hiérarchique",
                        service.getId()
                );
            }

            // 10. Send SSE update
            sseController.sendUpdate("created", savedDemande);

            // 11. Return response
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "status", "success",
                    "message", "Demande de formation créée avec succès",
                    "data", Map.of(
                            "demandeId", savedDemande.getId(),
                            "responseId", savedResponse.getId()
                    )
            ));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Error creating demande formation: ", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "status", "error",
                    "message", "Erreur interne du serveur"
            ));
        }
    }

    @GetMapping("/approved")
    public ResponseEntity<?> getDemandesFormationApprovedByChef1() {
        try {
            // 1. Get all responses where chef1 approved ("O")
            List<Response_chefs_dem_formation> reponsesChef1 = responseChefsFormationRepository.findByResponseChef1("O");

            // 2. Extract the IDs of approved requests
            List<String> demandeIds = reponsesChef1.stream()
                    .map(Response_chefs_dem_formation::getDemandeId)
                    .collect(Collectors.toList());

            // 3. Get the corresponding formation requests
            List<DemandeFormation> demandes = demandeFormationRepository.findByIdIn(demandeIds);

            // 4. Format the response with formation details
            List<Map<String, Object>> response = demandes.stream()
                    .map(demande -> {
                        Map<String, Object> demandeMap = new HashMap<>();
                        demandeMap.put("id", demande.getId());
                        demandeMap.put("dateDemande", demande.getDateDemande());
                        demandeMap.put("typeDemande", demande.getTypeDemande());
                        demandeMap.put("dateDebut", demande.getDateDebut());
                        demandeMap.put("nbrJours", demande.getNbrJours());
                        demandeMap.put("texteDemande", demande.getTexteDemande());
                        demandeMap.put("titre", demande.getTitre());
                        demandeMap.put("type", demande.getType());
                        demandeMap.put("theme", demande.getTheme());

                        demandeMap.put("reponseRH", demande.getReponseRH());
                        demandeMap.put("reponseChef", demande.getReponseChef());

                        // Add personnel information
                        if (demande.getMatPers() != null) {
                            Map<String, Object> personnelMap = new HashMap<>();
                            personnelMap.put("id", demande.getMatPers().getId());
                            personnelMap.put("matricule", demande.getMatPers().getMatricule());
                            personnelMap.put("nom", demande.getMatPers().getNom());
                            personnelMap.put("prenom", demande.getMatPers().getPrenom());
                            demandeMap.put("matPers", personnelMap);
                        }

                        // Add formation details
                        if (demande.getTitre() != null) {
                            demandeMap.put("titre", demande.getTitre().getTitre());
                        }
                        if (demande.getTheme() != null) {
                            demandeMap.put("theme", demande.getTheme().getTheme());
                        }
                        if (demande.getType() != null) {
                            demandeMap.put("type", demande.getType().getType());
                        }

                        // Add response details
                        if (demande.getResponseChefs() != null) {
                            Map<String, Object> responseMap = new HashMap<>();
                            responseMap.put("responseChef1", demande.getResponseChefs().getResponseChef1());
                            responseMap.put("observationChef1", demande.getResponseChefs().getObservationChef1());
                            responseMap.put("dateChef1", demande.getResponseChefs().getDateChef1());
                            demandeMap.put("responseChefs", responseMap);
                        }

                        return demandeMap;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error fetching approved formation requests", e);
            return ResponseEntity.internalServerError().body(
                    Map.of(
                            "status", "error",
                            "message", "Erreur lors de la récupération des demandes de formation approuvées",
                            "error", e.getMessage()
                    )
            );
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


        // check that looks at all chef approvals
        List<DemandeFormation> allDemandes = demandeFormationRepository.findByMatPersId(matPersId);

        List<DemandeFormation> approvedDemandes = allDemandes.stream()
                .filter(demande -> {
                    // Check if any chef has approved (O)
                    Response_chefs_dem_formation response = demande.getResponseChefs();
                    if (response == null) return false;

                    return "O".equals(response.getResponseChef1()) ||
                            "O".equals(response.getResponseChef2()) ||
                            "O".equals(response.getResponseChef3());
                })
                .collect(Collectors.toList());

        if (approvedDemandes.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(approvedDemandes);
    }

    @GetMapping("/personnel/{matPersId}/approved-by-chef1")
    public ResponseEntity<List<DemandeFormation>> getDemandesApprovedByChef1(
            @PathVariable String matPersId) {

        // 1. Récupérer toutes les demandes du personnel
        List<DemandeFormation> allDemandes = demandeFormationRepository.findByMatPersId(matPersId);

        if (allDemandes.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        // 2. Filtrer celles approuvées par le chef de poids 1
        List<DemandeFormation> approvedByChef1 = allDemandes.stream()
                .filter(demande -> {
                    Response_chefs_dem_formation response = demande.getResponseChefs();
                    return response != null && "O".equals(response.getResponseChef1());
                })
                .collect(Collectors.toList());

        if (approvedByChef1.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(approvedByChef1);
    }

    @PutMapping("/valider/{id}")
    public ResponseEntity<?> validerDemandeFormation(
            @PathVariable String id,
            @RequestParam String chefId,
            @RequestBody Map<String, String> request) {

        try {
            // 1. Validation des entrées
            if (!ObjectId.isValid(chefId)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "ID du chef invalide"
                ));
            }

            if (request == null || request.get("observation") == null || request.get("observation").isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "Une observation est obligatoire"
                ));
            }

            // 2. Recherche de la demande et de sa réponse
            DemandeFormation demande = demandeFormationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Demande de formation non trouvée"));

            // 3. Vérification du statut actuel
            if (demande.getReponseChef() == Reponse.N) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "Cette demande a déjà été refusée et ne peut plus être modifiée"
                ));
            }

            if (demande.getReponseChef() == Reponse.O) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "Cette demande a déjà été approuvée et ne peut plus être modifiée"
                ));
            }

            // 4. Vérification que le validateur appartient au même service
            Validator validationInfo = validatorRepository.findByChefId(chefId)
                    .stream()
                    .filter(v -> v.getService().getId().equals(demande.getMatPers().getService().getId()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Ce chef n'est pas validateur pour le service de l'employé"));

            // Récupération de la réponse
            Response_chefs_dem_formation response = responseChefsRepository.findByDemandeId(id)
                    .orElseThrow(() -> new RuntimeException("Réponse de validation non trouvée pour cette demande"));

            // 5. Mise à jour selon le poids du validateur
            int poidChef = validationInfo.getPoid();
            String observation = request.get("observation");
            String dateValidation = LocalDateTime.now().toString();

            switch (poidChef) {
                case 1:
                    if (!"I".equals(response.getResponseChef1())) {
                        return ResponseEntity.badRequest().body(Map.of(
                                "status", "error",
                                "message", "Ce chef a déjà validé ou refusé cette demande"
                        ));
                    }
                    response.setResponseChef1("O");
                    response.setObservationChef1(observation);
                    response.setDateChef1(dateValidation);
                    break;

                case 2:
                    if (!"I".equals(response.getResponseChef2())) {
                        return ResponseEntity.badRequest().body(Map.of(
                                "status", "error",
                                "message", "Ce chef a déjà validé ou refusé cette demande"
                        ));
                    }
                    response.setResponseChef2("O");
                    response.setObservationChef2(observation);
                    response.setDateChef2(dateValidation);
                    break;

                case 3:
                    if (!"I".equals(response.getResponseChef3())) {
                        return ResponseEntity.badRequest().body(Map.of(
                                "status", "error",
                                "message", "Ce chef a déjà validé ou refusé cette demande"
                        ));
                    }
                    response.setResponseChef3("O");
                    response.setObservationChef3(observation);
                    response.setDateChef3(dateValidation);
                    break;

                default:
                    return ResponseEntity.badRequest().body(Map.of(
                            "status", "error",
                            "message", "Poids de validation invalide"
                    ));
            }

            // 6. Sauvegarde de la réponse
            responseChefsRepository.save(response);

            // 7. Vérification si toutes les validations sont complètes
            boolean tousValides = "O".equals(response.getResponseChef1())
                    && "O".equals(response.getResponseChef2())
                    && "O".equals(response.getResponseChef3());

            // 8. Mise à jour du statut principal
            demande.setReponseChef(tousValides ? Reponse.O : Reponse.I);
            demande.setResponseChefs(response);
            demandeFormationRepository.save(demande);

            // 9. Notification de l'employé
            if (demande.getMatPers() != null) {
                String message = tousValides
                        ? "Votre demande de formation a été approuvée"
                        : String.format("Validation reçue (Chef %d)", poidChef);

                notificationService.createNotification(
                        message,
                        "collaborateur",
                        demande.getMatPers().getId()
                );
            }

            // 10. Mise à jour SSE
            sseController.sendUpdate("updated", demande);

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", tousValides ? "Demande approuvée" : "Validation enregistrée",
                    "validationComplete", tousValides,
                    "poidValidateur", poidChef
            ));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "status", "error",
                    "message", "Erreur technique",
                    "details", e.getMessage()
            ));
        }
    }

    @PutMapping("/refuser/{id}")
    public ResponseEntity<?> refuserDemandeFormation(
            @PathVariable String id,
            @RequestParam String chefId,
            @RequestBody Map<String, String> request) {

        try {
            // 1. Validation des entrées
            if (!ObjectId.isValid(chefId)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "ID du chef invalide"
                ));
            }

            if (request == null || request.get("observation") == null || request.get("observation").isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "Une observation est obligatoire pour le refus"
                ));
            }

            // 2. Recherche de la demande et de sa réponse
            DemandeFormation demande = demandeFormationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Demande de formation non trouvée"));

            // 3. Vérification du statut actuel
            if (demande.getReponseChef() == Reponse.N) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "Cette demande a déjà été refusée et ne peut plus être modifiée"
                ));
            }

            if (demande.getReponseChef() == Reponse.O) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "Cette demande a déjà été approuvée et ne peut plus être modifiée"
                ));
            }

            // 4. Vérification que le validateur appartient au même service
            Validator validationInfo = validatorRepository.findByChefId(chefId)
                    .stream()
                    .filter(v -> v.getService().getId().equals(demande.getMatPers().getService().getId()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Ce chef n'est pas validateur pour le service de l'employé"));

            // Récupération de la réponse
            Response_chefs_dem_formation response = responseChefsRepository.findByDemandeId(id)
                    .orElseThrow(() -> new RuntimeException("Réponse de validation non trouvée pour cette demande"));

            // 5. Mise à jour selon le poids du validateur
            int poidChef = validationInfo.getPoid();
            String observation = request.get("observation");
            String dateValidation = LocalDateTime.now().toString();

            switch (poidChef) {
                case 1:
                    if (!"I".equals(response.getResponseChef1())) {
                        return ResponseEntity.badRequest().body(Map.of(
                                "status", "error",
                                "message", "Ce chef a déjà validé ou refusé cette demande"
                        ));
                    }
                    response.setResponseChef1("N");
                    response.setObservationChef1(observation);
                    response.setDateChef1(dateValidation);
                    break;

                case 2:
                    if (!"I".equals(response.getResponseChef2())) {
                        return ResponseEntity.badRequest().body(Map.of(
                                "status", "error",
                                "message", "Ce chef a déjà validé ou refusé cette demande"
                        ));
                    }
                    response.setResponseChef2("N");
                    response.setObservationChef2(observation);
                    response.setDateChef2(dateValidation);
                    break;

                case 3:
                    if (!"I".equals(response.getResponseChef3())) {
                        return ResponseEntity.badRequest().body(Map.of(
                                "status", "error",
                                "message", "Ce chef a déjà validé ou refusé cette demande"
                        ));
                    }
                    response.setResponseChef3("N");
                    response.setObservationChef3(observation);
                    response.setDateChef3(dateValidation);
                    break;

                default:
                    return ResponseEntity.badRequest().body(Map.of(
                            "status", "error",
                            "message", "Poids de validation invalide"
                    ));
            }

            // 6. Sauvegarde du refus
            responseChefsRepository.save(response);

            // 7. Mise à jour du statut principal (refus immédiat)
            demande.setReponseChef(Reponse.N);
            demande.setObservation("Refusé par chef poids " + poidChef + ": " + observation);
            demande.setResponseChefs(response);
            demandeFormationRepository.save(demande);

            // 8. Notification de l'employé
            if (demande.getMatPers() != null) {
                notificationService.createNotification(
                        "Votre demande de formation a été refusée",
                        "collaborateur",
                        demande.getMatPers().getId()
                );
            }

            // 9. Mise à jour SSE
            sseController.sendUpdate("updated", demande);

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Demande refusée avec succès",
                    "poidValidateur", poidChef
            ));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "status", "error",
                    "message", "Erreur technique",
                    "details", e.getMessage()
            ));
        }
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
                                    "/demande-formation/" + updatedDemande.getId()
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
    public ResponseEntity<?> getDemandesFormationByService(@PathVariable String chefserviceid) {
        try {
            // 1. Validate ID format
            if (!ObjectId.isValid(chefserviceid)) {
                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "status", "error",
                                "message", "ID invalide",
                                "providedId", chefserviceid
                        ));
            }

            ObjectId chefId = new ObjectId(chefserviceid);

            // 2. Get chef information
            Personnel chef = mongoTemplate.findOne(
                    new Query(Criteria.where("_id").is(chefId)),
                    Personnel.class
            );
            if (chef == null) {
                return ResponseEntity.notFound().build();
            }

            // 3. Find services where chef is validator
            List<Validator> chefValidators = mongoTemplate.find(
                    new Query(Criteria.where("chef.$id").is(chefId)),
                    Validator.class
            );

            if (chefValidators.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "status", "success",
                        "message", "Aucun service associé à ce chef",
                        "chef", buildPersonnelMap(chef),
                        "demandes", Collections.emptyList()
                ));
            }

            // 4. Get service IDs
            List<ObjectId> serviceIds = chefValidators.stream()
                    .map(Validator::getService)
                    .filter(Objects::nonNull)
                    .map(service -> new ObjectId(service.getId()))
                    .distinct()
                    .collect(Collectors.toList());

            // 5. Get all personnel in these services (excluding current chef)
            List<Personnel> servicePersonnel = mongoTemplate.find(
                    new Query(Criteria.where("service.$id").in(serviceIds)
                            .and("_id").ne(chefId)),
                    Personnel.class
            );

            // 6. Get demandes for these personnel
            List<ObjectId> personnelIds = servicePersonnel.stream()
                    .map(p -> new ObjectId(p.getId()))
                    .collect(Collectors.toList());

            List<DemandeFormation> demandes = mongoTemplate.find(
                    new Query(Criteria.where("matPers.$id").in(personnelIds))
                            .with(Sort.by(Sort.Direction.DESC, "dateDemande")),
                    DemandeFormation.class
            );

            // 7. Prepare response
            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "chef", buildPersonnelMap(chef),
                    "services", buildServiceList(chefValidators),
                    "statistics", buildFormationStatistics(servicePersonnel, demandes),
                    "demandes", buildDemandeFormationList(demandes),
                    "debug", buildDebugInfo(serviceIds)
            ));

        } catch (Exception e) {
            log.error("Error in getDemandesFormationByService: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "status", "error",
                    "message", "Erreur technique",
                    "error", e.getMessage()
            ));
        }
    }

    // Specific method for formation statistics
    private Map<String, Object> buildFormationStatistics(List<Personnel> personnel, List<DemandeFormation> demandes) {
        return Map.of(
                "totalPersonnel", personnel.size(),
                "demandesFormation", demandes.size(),
                "roles", personnel.stream()
                        .collect(Collectors.groupingBy(
                                Personnel::getRole,
                                Collectors.counting()
                        )),
                "statutDemandes", Map.of(
                        "enAttente", demandes.stream().filter(d -> "En attente".equals(d.getReponseChef())).count(),
                        "approuvees", demandes.stream().filter(d -> "Approuvé".equals(d.getReponseChef())).count(),
                        "refusees", demandes.stream().filter(d -> "Refusé".equals(d.getReponseChef())).count()
                ),
                "typesFormation", demandes.stream()
                        .collect(Collectors.groupingBy(
                                DemandeFormation::getType,
                                Collectors.counting()
                        ))
        );
    }

    private List<Map<String, Object>> buildDemandeFormationList(List<DemandeFormation> demandes) {
        return demandes.stream()
                .map(this::convertDemandeFormationToMap)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    private Map<String, Object> convertDemandeFormationToMap(DemandeFormation d) {
        try {
            Map<String, Object> map = new LinkedHashMap<>();

            // Basic fields
            map.put("id_libre_demande", d.getId());
            map.put("dateDemande", d.getDateDemande());
            map.put("typeDemande", d.getTypeDemande());
            map.put("titre", d.getTitre());
            map.put("type", d.getType());
            map.put("theme", d.getTheme());
            map.put("dateDebut", d.getDateDebut());
            map.put("nbrJours", d.getNbrJours());
            map.put("reponseChef", d.getResponseChefs());

            // Optional fields
            Optional.ofNullable(d.getTexteDemande()).ifPresent(v -> map.put("texteDemande", v));
            Optional.ofNullable(d.getObservation()).ifPresent(v -> map.put("observation", v));

            // Personnel information
            map.put("matPers", Optional.ofNullable(d.getMatPers())
                    .map(p -> Map.of(
                            "id", p.getId(),
                            "matricule", defaultIfNull(p.getMatricule(), ""),
                            "nom", defaultIfNull(p.getNom(), ""),
                            "prenom", defaultIfNull(p.getPrenom(), ""),
                            "email", defaultIfNull(p.getEmail(), ""),
                            "service", defaultIfNull(p.getServiceName(), "")

                    ))
                    .orElse(null));

            // Files information
            map.put("files", Optional.ofNullable(d.getFiles())
                    .orElse(Collections.emptyList()).stream()
                    .filter(Objects::nonNull)
                    .map(f -> Map.of(
                            "id", defaultIfNull(f.getId(), ""),
                            "fileId", defaultIfNull(f.getFileId(), ""),
                            "filename", defaultIfNull(f.getFilename(), ""),
                            "fileType", defaultIfNull(f.getFileType(), "")
                    ))
                    .collect(Collectors.toList()));

            return map;
        } catch (Exception e) {
            log.error("Error converting demande formation {} to map: {}", d.getId(), e.getMessage());
            return null;
        }
    }

    // Reuse these existing helper methods from the previous implementation
    private Map<String, Object> buildPersonnelMap(Personnel personnel) {
        return Map.of(
                "id", personnel.getId(),
                "nomComplet", personnel.getNom() + " " + personnel.getPrenom(),
                "role", personnel.getRole(),
                "email", personnel.getEmail()
        );
    }

    private List<Map<String, Object>> buildServiceList(List<Validator> validators) {
        List<Map<String, Object>> result = new ArrayList<>();

        for (Validator v : validators) {
            if (v.getService() != null) {
                Map<String, Object> serviceMap = new HashMap<>();
                serviceMap.put("id", v.getService().getId());
                serviceMap.put("name", v.getService().getServiceName());
                serviceMap.put("poid", v.getPoid());
                result.add(serviceMap);
            }
        }

        return result;
    }

    private Map<String, Object> buildDebugInfo(List<ObjectId> serviceIds) {
        return Map.of(
                "serviceIds", serviceIds.stream()
                        .map(ObjectId::toString)
                        .collect(Collectors.toList())
        );
    }

    private String defaultIfNull(String value, String defaultValue) {
        return value != null ? value : defaultValue;
    }
    private Map<String, Object> convertDemandeToSafeResponse(DemandeFormation demande) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", demande.getId());
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
        demandeMap.put("id", demande.getId());
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



    @GetMapping("/{id}/details")
    public ResponseEntity<?> getDemandeDetails(@PathVariable String id) {
        Optional<DemandeFormation> demandeOpt = demandeFormationRepository.findById(id);

        if (demandeOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        DemandeFormation demande = demandeOpt.get();

        Map<String, Object> response = new HashMap<>();
        response.put("id", demande.getId());
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