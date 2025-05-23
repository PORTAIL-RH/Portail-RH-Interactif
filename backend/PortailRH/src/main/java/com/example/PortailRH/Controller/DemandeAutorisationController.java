package com.example.PortailRH.Controller;

import com.example.PortailRH.DTO.PersonnelDTO;
import com.example.PortailRH.Model.*;
import com.example.PortailRH.Repository.*;
import com.example.PortailRH.Service.FichierJointService;
import com.example.PortailRH.Service.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
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
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/demande-autorisation")
@Slf4j
public class DemandeAutorisationController {

    @Autowired
    private DemandeAutorisationRepository demandeAutorisationRepository;
    @Autowired
    private ValidatorRepository validatorRepository;

    @Autowired
    private ResponseChefsAutorisationRepository responseChefsDemAutorisationRepository;

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
    public ResponseEntity<Map<String, Object>> createDemandeAutorisation(
            @RequestParam("dateDebut") String dateDebutStr,
            @RequestParam("texteDemande") String texteDemande,
            @RequestParam("heureSortie") String heureSortieStr,
            @RequestParam("heureRetour") String heureRetourStr,
            @RequestParam("codAutorisation") String codAutorisation,
            @RequestParam("codeSoc") String codeSoc,
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

            // 2. Validate and parse date and times
            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
            Date dateDebut = dateFormat.parse(dateDebutStr);

            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
            LocalTime heureSortie = LocalTime.parse(heureSortieStr, timeFormatter);
            LocalTime heureRetour = LocalTime.parse(heureRetourStr, timeFormatter);

            if (heureSortie.isAfter(heureRetour)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "Exit time must be before return time"
                ));
            }

            // 3. Handle file upload
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

            // 4. Create and save chefs' responses first
            Response_chefs_dem_autorisation responseChefs = new Response_chefs_dem_autorisation();
            responseChefs.setResponseChef1("I");
            responseChefs.setResponseChef2("I");
            responseChefs.setResponseChef3("I");
            responseChefs.setObservationChef1("");
            responseChefs.setObservationChef2("");
            responseChefs.setObservationChef3("");
            responseChefs.setDateChef1("");
            responseChefs.setDateChef2("");
            responseChefs.setDateChef3("");

            Response_chefs_dem_autorisation savedResponse = responseChefsDemAutorisationRepository.save(responseChefs);

            // 5. Create and save authorization request
            DemandeAutorisation demande = new DemandeAutorisation();
            demande.setDateDebut(dateDebut);
            demande.setTexteDemande(texteDemande);
            demande.setHoraireSortie(heureSortie.getHour());
            demande.setMinuteSortie(heureSortie.getMinute());
            demande.setHoraireRetour(heureRetour.getHour());
            demande.setMinuteRetour(heureRetour.getMinute());
            demande.setCodAutorisation(codAutorisation);
            demande.setTypeDemande("autorisation");
            demande.setMatPers(personnel);
            demande.setCodeSoc(codeSoc);
            demande.setReponseChef(Reponse.I);
            demande.setReponseRH(Reponse.I);
            demande.setResponseChefs(savedResponse); // Set the response reference

            if (fichierJoint != null) {
                demande.setFiles(List.of(fichierJoint));
            }

            DemandeAutorisation savedDemande = demandeAutorisationRepository.save(demande);

            // 6. Update response with demande ID
            savedResponse.setDemandeId(savedDemande.getId());
            responseChefsDemAutorisationRepository.save(savedResponse);

            // 7. Send notifications
            Service service = personnel.getService();
            String notificationMessage = String.format(
                    "Nouvelle demande d'autorisation de %s %s (Sortie: %s, Retour: %s)",
                    personnel.getNom(), personnel.getPrenom(), heureSortieStr, heureRetourStr
            );

            if (service != null ) {
                notificationService.createNotification(
                        notificationMessage + " - Service: " + service.getServiceName(),
                        "Chef Hiérarchique",
                        null,
                        service.getId(),
                        personnel.getCode_soc()
                );
            }

            // 8. Send SSE update
            sseController.sendUpdate("created", savedDemande);

            // 9. Return response
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "status", "success",
                    "message", "Demande d'autorisation créée avec succès",
                    "data", Map.of(
                            "demandeId", savedDemande.getId(),
                            "responseId", savedResponse.getId()
                    )
            ));

        } catch (ParseException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "Format de date invalide. Utilisez YYYY-MM-DD"
            ));
        } catch (DateTimeParseException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "Format d'heure invalide. Utilisez HH:mm"
            ));
        } catch (Exception e) {
            log.error("Error creating demande autorisation: ", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "status", "error",
                    "message", "Erreur interne du serveur"
            ));
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


                // Send notification
                notificationService.createNotification(
                        "Demande de formation de personnel %s a été mise à jour"+ updatedDemande.getMatPers().getNom(),
                        "Chef Hiérarchique",
                        updatedDemande.getMatPers().getId(),
                        updatedDemande.getMatPers().getServiceId(),
                        updatedDemande.getCodeSoc()
                );


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
    public ResponseEntity<?> validerDemandeAutorisation(
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
            DemandeAutorisation demande = demandeAutorisationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Demande d'autorisation non trouvée"));

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
            Response_chefs_dem_autorisation response = responseChefsDemAutorisationRepository.findByDemandeId(id)
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
            responseChefsDemAutorisationRepository.save(response);

            if (demande.getMatPers() != null) {
                String message = String.format("Demande d'autorisation de personnel %s a été approuvée - Validation reçue (Chef %d)",
                        demande.getMatPers().getNom(), poidChef);

                notificationService.createNotification(
                        message,
                        "RH",
                        null,
                        null,
                        demande.getMatPers().getCode_soc()
                );
            }


            // 7. Vérification si toutes les validations sont complètes
            boolean tousValides = "O".equals(response.getResponseChef1())
                    && "O".equals(response.getResponseChef2())
                    && "O".equals(response.getResponseChef3());

            // 8. Mise à jour du statut principal
            demande.setReponseChef(tousValides ? Reponse.O : Reponse.I);
            demande.setResponseChefs(response);
            demandeAutorisationRepository.save(demande);


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
    public ResponseEntity<?> refuserDemandeAutorisation(
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
            DemandeAutorisation demande = demandeAutorisationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Demande d'autorisation non trouvée"));

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
            Response_chefs_dem_autorisation response = responseChefsDemAutorisationRepository.findByDemandeId(id)
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
            responseChefsDemAutorisationRepository.save(response);

            // 7. Mise à jour du statut principal (refus immédiat)
            demande.setReponseChef(Reponse.N);
            demande.setObservation("Refusé par chef poids " + poidChef + ": " + observation);
            demande.setResponseChefs(response);
            demandeAutorisationRepository.save(demande);

            // 8. Notification de l'employé
            if (demande.getMatPers().getRole() == "RH") {
                notificationService.createNotification(
                        "Votre demande d'autorisation a été refusé par RH",
                        null,
                        demande.getMatPers().getId(),
                        null,
                        null
                );
            }
            else if (demande.getMatPers().getRole() == "RH"){
                String message = String.format("Demande d'autorisation de personnel %s a été refusé par chef (Chef %d)",
                        demande.getMatPers().getNom(), poidChef);
                notificationService.createNotification(
                        message,
                        "RH",
                        null,
                        null,
                        demande.getMatPers().getCode_soc()
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
    public ResponseEntity<String> traiterDemande(
            @PathVariable String id,
            @RequestParam(value = "observation", required = false) String observation) {
        return demandeAutorisationRepository.findById(id).map(demande -> {
            demande.setReponseRH(Reponse.T);
            demande.setObservation(observation); // Set observation if provided
            demandeAutorisationRepository.save(demande);

            // Get the collaborateur ID from the associated Personnel object
            Personnel collaborateur = demande.getMatPers();
            if (collaborateur == null) {
                return ResponseEntity.badRequest().body("Aucun collaborateur associé à cette demande");
            }
            String collaborateurId = collaborateur.getId();
            String message = "Votre demande d'autorisation a été traiter.";

            // Create and send the notification
            notificationService.createNotification(message, null, collaborateurId,null,null);

            return ResponseEntity.ok("Demande traitée avec succès");
        }).orElse(ResponseEntity.notFound().build());
    }
    @Autowired
    private MongoTemplate mongoTemplate;

    @GetMapping("/collaborateurs-by-service/{chefserviceid}")
    public ResponseEntity<?> getDemandesAutorisationByService(@PathVariable String chefserviceid) {
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

            List<DemandeAutorisation> demandes = mongoTemplate.find(
                    new Query(Criteria.where("matPers.$id").in(personnelIds))
                            .with(Sort.by(Sort.Direction.DESC, "dateDemande")),
                    DemandeAutorisation.class
            );

            // 7. Prepare response
            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "chef", buildPersonnelMap(chef),
                    "services", buildServiceList(chefValidators),
                    "statistics", buildAutorisationStatistics(servicePersonnel, demandes),
                    "demandes", buildDemandeAutorisationList(demandes),
                    "debug", buildDebugInfo(serviceIds)
            ));

        } catch (Exception e) {
            log.error("Error in getDemandesAutorisationByService: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "status", "error",
                    "message", "Erreur technique",
                    "error", e.getMessage()
            ));
        }
    }

    // Specific statistics method for DemandeAutorisation
    private Map<String, Object> buildAutorisationStatistics(List<Personnel> personnel, List<DemandeAutorisation> demandes) {
        return Map.of(
                "totalPersonnel", personnel.size(),
                "demandesAutorisation", demandes.size(),
                "roles", personnel.stream()
                        .collect(Collectors.groupingBy(
                                Personnel::getRole,
                                Collectors.counting()
                        )),
                "statutDemandes", Map.of(
                        "enAttente", demandes.stream().filter(d -> "En attente".equals(d.getReponseChef())).count(),
                        "approuvees", demandes.stream().filter(d -> "Approuvé".equals(d.getReponseChef())).count(),
                        "refusees", demandes.stream().filter(d -> "Refusé".equals(d.getReponseChef())).count()
                )
        );
    }

    private List<Map<String, Object>> buildDemandeAutorisationList(List<DemandeAutorisation> demandes) {
        return demandes.stream()
                .map(this::convertDemandeAutorisationToMap)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    private Map<String, Object> convertDemandeAutorisationToMap(DemandeAutorisation d) {
        try {
            Map<String, Object> map = new LinkedHashMap<>();

            // Basic fields
            map.put("id", d.getId());
            map.put("dateDemande", d.getDateDemande());
            map.put("typeDemande", d.getTypeDemande());
            map.put("codeSoc", d.getCodeSoc());
            map.put("dateDebut", d.getDateDebut());
            map.put("reponseChef", d.getResponseChefs());
            map.put("reponseRH", d.getReponseRH());
            map.put("heureSortie", d.getHeureSortie());
            map.put("heureRetour", d.getHeureRetour());
            map.put("horaireSortie", d.getHoraireSortie());
            map.put("horaireRetour", d.getHoraireRetour());
            map.put("minuteSortie", d.getMinuteSortie());
            map.put("minuteRetour", d.getMinuteRetour());
            map.put("codAutorisation", d.getCodAutorisation());

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
            log.error("Error converting demande autorisation {} to map: {}", d.getId(), e.getMessage());
            return null;
        }
    }

    // Shared helper methods
    private Map<String, Object> buildPersonnelMap(Personnel personnel) {
        return Map.of(
                "id", personnel.getId(),
                "nomComplet", personnel.getNom() + " " + personnel.getPrenom(),
                "role", personnel.getRole(),
                "email", personnel.getEmail(),
                "service", personnel.getServiceName()

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
    private PersonnelDTO convertPersonnelToSafeDto(Personnel personnel) {
        System.out.println("27. [DEBUG] Converting personnel to safe DTO: " + personnel.getId());

        PersonnelDTO dto = new PersonnelDTO();
        try {
            // Set basic fields
            dto.setId(personnel.getId());
            dto.setMatricule(personnel.getMatricule());
            dto.setNom(personnel.getNom());
            dto.setPrenom(personnel.getPrenom());
            dto.setEmail(personnel.getEmail());

            // Handle service reference safely
            if (personnel.getService() != null) {
                System.out.println("28. [DEBUG] Adding service reference");
                dto.setServiceId(personnel.getService().getId());
                dto.setServiceName(personnel.getService().getServiceName());
            }

            // Handle chef reference safely
            if (personnel.getChefHierarchique() != null) {
                System.out.println("29. [DEBUG] Adding chef reference");
                Personnel chef = personnel.getChefHierarchique();
                dto.setChefHierarchiqueId(chef.getId());
                dto.setChefHierarchiqueNom(chef.getNom());
                dto.setChefHierarchiquePrenom(chef.getPrenom());
            }
        } catch (Exception e) {
            System.out.println("30. [ERROR] Error converting personnel to DTO: " + e.getMessage());
        }

        return dto;
    }


    @GetMapping("/approved")
    public ResponseEntity<?> getDemandesApprovedByChef1() {
        try {
            // 1. Récupérer toutes les réponses où le chef1 a approuvé ("O")
            List<Response_chefs_dem_autorisation> reponsesChef1 = responseChefsDemAutorisationRepository.findByResponseChef1("O");

            // 2. Extraire les IDs des demandes approuvées
            List<String> demandeIds = reponsesChef1.stream()
                    .map(Response_chefs_dem_autorisation::getDemandeId)
                    .collect(Collectors.toList());

            // 3. Récupérer les demandes correspondantes
            List<DemandeAutorisation> demandes = demandeAutorisationRepository.findByIdIn(demandeIds);

            return ResponseEntity.ok(demandes);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    Map.of(
                            "status", "error",
                            "message", "Erreur lors de la récupération des demandes",
                            "error", e.getMessage()
                    )
            );
        }
    }

    @GetMapping("/personnel/{matPersId}/approved")
    public ResponseEntity<List<DemandeAutorisation>> getApprovedDemandesAutorisationByPersonnelId(
            @PathVariable String matPersId) {

        // check that looks at all chef approvals
        List<DemandeAutorisation> allDemandes = demandeAutorisationRepository.findByMatPers_Id(matPersId);

        List<DemandeAutorisation> approvedDemandes = allDemandes.stream()
                .filter(demande -> {
                    // Check if any chef has approved (O)
                    Response_chefs_dem_autorisation response = demande.getResponseChefs();
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
    public ResponseEntity<List<DemandeAutorisation>> getDemandesApprovedByChef1(
            @PathVariable String matPersId) {

        // 1. Récupérer toutes les demandes du personnel
        List<DemandeAutorisation> allDemandes = demandeAutorisationRepository.findByMatPers_Id(matPersId);

        if (allDemandes.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        // 2. Filtrer celles approuvées par le chef de poids 1
        List<DemandeAutorisation> approvedByChef1 = allDemandes.stream()
                .filter(demande -> {
                    Response_chefs_dem_autorisation response = demande.getResponseChefs();
                    return response != null && "O".equals(response.getResponseChef1());
                })
                .collect(Collectors.toList());

        if (approvedByChef1.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(approvedByChef1);
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