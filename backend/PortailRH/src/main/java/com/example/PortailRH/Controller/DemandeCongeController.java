package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.*;
import com.example.PortailRH.Repository.*;
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
import java.time.Year;
import java.util.*;
import java.util.stream.Collectors;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/demande-conge")
@Slf4j

public class DemandeCongeController {
    @Autowired
    private ResponseChefsDemCongeRepository responseChefsDemCongeRepository;
    @Autowired
    private ValidatorRepository validatorRepository;

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
            Optional<Personnel> personnelOptional = personnelRepository.findById(matPersId);
            if (personnelOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "status", "error",
                        "message", "User not found with ID: " + matPersId
                ));
            }
            Personnel personnel = personnelOptional.get();

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

            // 4. Check leave quota
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

            // 5. Handle file upload
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
            demande.setMatPers(personnel);
            demande.setCodeSoc(codeSoc);
            demande.setReponseChef(Reponse.I);
            demande.setReponseRH(Reponse.I);

            if (fichierJoint != null) {
                demande.setFiles(List.of(fichierJoint));
            }

            // 7. Create and save chefs' responses first
            Response_chefs_dem_conge responseChefs = new Response_chefs_dem_conge();
            responseChefs.setResponseChef1("I");
            responseChefs.setResponseChef2("I");
            responseChefs.setResponseChef3("I");
            responseChefs.setObservationChef1("");
            responseChefs.setObservationChef2("");
            responseChefs.setObservationChef3("");
            responseChefs.setDateChef1("");
            responseChefs.setDateChef2("");
            responseChefs.setDateChef3("");

            Response_chefs_dem_conge savedResponse = responseChefsDemCongeRepository.save(responseChefs);

            // 8. Set the response reference before saving demande
            demande.setResponseChefs(savedResponse);
            DemandeConge savedDemande = demandeCongeRepository.save(demande);

            // 9. Update response with demande ID
            savedResponse.setDemandeId(savedDemande.getId());
            responseChefsDemCongeRepository.save(savedResponse);

            // 10. Send notifications
            Service service = personnel.getService();
            String notificationMessage = String.format(
                    "Nouvelle demande de congé de %s %s (%s jours)",
                    personnel.getNom(), personnel.getPrenom(), nbrJours
            );

            notificationService.createNotification(notificationMessage, "RH", null);

            if (service != null && service.getChef1() != null) {
                notificationService.createNotification(
                        notificationMessage + " - Service: " + service.getServiceName(),
                        "Chef Hiérarchique",
                        service.getId()
                );
            }

            // 11. Return response
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "status", "success",
                    "message", "Demande de congé créée avec succès",
                    "data", Map.of(
                            "demandeId", savedDemande.getId(),
                            "responseId", savedResponse.getId(),
                            "remainingDays", DemandeConge.MAX_DAYS_PER_YEAR - (usedDays + nbrJours)
                    )
            ));

        } catch (ParseException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "Format de date invalide. Utilisez YYYY-MM-DD"
            ));
        } catch (Exception e) {
            log.error("Error creating demande conge: ", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "status", "error",
                    "message", "Erreur interne du serveur"
            ));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDemande(
            @PathVariable String id,
            @RequestBody Map<String, Object> requestData) {

        return demandeCongeRepository.findById(id).map(existingDemande -> {
            try {
                // Update common fields
                if (requestData.containsKey("texteDemande")) {
                    existingDemande.setTexteDemande((String) requestData.get("texteDemande"));
                }

                // Update date fields
                if (requestData.containsKey("dateDebut")) {
                    Object dateDebut = requestData.get("dateDebut");
                    if (dateDebut instanceof String) {
                        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
                        existingDemande.setDateDebut(dateFormat.parse((String) dateDebut));
                    } else if (dateDebut instanceof Date) {
                        existingDemande.setDateDebut((Date) dateDebut);
                    }
                }

                if (requestData.containsKey("dateFin")) {
                    Object dateFin = requestData.get("dateFin");
                    if (dateFin instanceof String) {
                        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
                        existingDemande.setDateFin(dateFormat.parse((String) dateFin));
                    } else if (dateFin instanceof Date) {
                        existingDemande.setDateFin((Date) dateFin);
                    }
                }

                // Update period fields
                if (requestData.containsKey("snjTempDep")) {
                    existingDemande.setSnjTempDep((String) requestData.get("snjTempDep"));
                }

                if (requestData.containsKey("snjTempRetour")) {
                    existingDemande.setSnjTempRetour((String) requestData.get("snjTempRetour"));
                }

                // Update number of days if provided
                if (requestData.containsKey("nbrJours")) {
                    Object nbrJours = requestData.get("nbrJours");
                    if (nbrJours instanceof Integer) {
                        existingDemande.setNbrJours((Integer) nbrJours);
                    } else if (nbrJours instanceof String) {
                        existingDemande.setNbrJours(Integer.parseInt((String) nbrJours));
                    }
                }

                // Save the updated demande
                DemandeConge updatedDemande = demandeCongeRepository.save(existingDemande);

                return ResponseEntity.ok(Map.of(
                        "message", "Demande de congé mise à jour avec succès",
                        "demandeId", updatedDemande.getId()
                ));

            } catch (ParseException e) {
                return ResponseEntity.badRequest().body("Format de date invalide. Utilisez le format 'yyyy-MM-dd'.");
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body("Format numérique invalide pour le nombre de jours");
            } catch (Exception e) {
                return ResponseEntity.internalServerError().body("Erreur serveur lors de la mise à jour");
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

    @GetMapping("/personnel/{matPersId}/approved")
    public ResponseEntity<List<DemandeConge>> getApprovedDemandesCongeByPersonnelId(
            @PathVariable String matPersId) {

        // Get all demandes for the personnel
        List<DemandeConge> allDemandes = demandeCongeRepository.findByMatPersId(matPersId);

        // Filter those approved by any chef
        List<DemandeConge> approvedDemandes = allDemandes.stream()
                .filter(demande -> {
                    Response_chefs_dem_conge response = demande.getResponseChefs();
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
    public ResponseEntity<List<DemandeConge>> getDemandesCongeApprovedByChef1(
            @PathVariable String matPersId) {

        // Get all demandes for the personnel
        List<DemandeConge> allDemandes = demandeCongeRepository.findByMatPersId(matPersId);

        if (allDemandes.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        // Filter those approved by chef of weight 1
        List<DemandeConge> approvedByChef1 = allDemandes.stream()
                .filter(demande -> {
                    Response_chefs_dem_conge response = demande.getResponseChefs();
                    return response != null && "O".equals(response.getResponseChef1());
                })
                .collect(Collectors.toList());

        if (approvedByChef1.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(approvedByChef1);
    }

    @PutMapping("/valider/{id}")
    public ResponseEntity<?> validerDemandeConge(
            @PathVariable String id,
            @RequestParam String chefId,
            @RequestBody Map<String, String> request) {

        try {
            // 1. Validate inputs
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

            // 2. Find leave request and its response
            DemandeConge demande = demandeCongeRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Demande de congé non trouvée"));

            // Get the response from repository instead of from demande object
            Response_chefs_dem_conge response = responseChefsDemCongeRepository.findByDemandeId(id)
                    .orElseThrow(() -> new RuntimeException("Réponse de validation non trouvée pour cette demande"));

            // 3. Check if request is already approved or rejected
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

            // 4. Verify validator
            Validator validationInfo = validatorRepository.findByChefId(chefId)
                    .stream()
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Ce chef n'est pas validateur"));

            // 5. Update based on validator's weight
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
            }

            // 6. Save validation response
            responseChefsDemCongeRepository.save(response);

            // 7. Check if all validations are complete
            boolean tousValides = "O".equals(response.getResponseChef1())
                    && "O".equals(response.getResponseChef2())
                    && "O".equals(response.getResponseChef3());

            // 8. Update main request status
            demande.setReponseChef(tousValides ? Reponse.O : Reponse.I);
            demande.setResponseChefs(response); // Ensure the link is maintained
            demandeCongeRepository.save(demande);

            // 9. Notify employee
            if (demande.getMatPers() != null) {
                String message = tousValides
                        ? "Votre demande de congé a été approuvée"
                        : "Votre demande a reçu une validation (en attente d'autres validations)";

                notificationService.createNotification(
                        message,
                        "collaborateur",
                        demande.getMatPers().getId()
                );
            }

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", tousValides ? "Demande approuvée" : "Validation partielle enregistrée",
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
    public ResponseEntity<?> refuserDemandeConge(
            @PathVariable String id,
            @RequestParam String chefId,
            @RequestBody Map<String, String> request) {

        try {
            // 1. Validate inputs
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

            // 2. Find leave request and its response
            DemandeConge demande = demandeCongeRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Demande de congé non trouvée"));

            Response_chefs_dem_conge response = responseChefsDemCongeRepository.findByDemandeId(id)
                    .orElseThrow(() -> new RuntimeException("Réponse de validation non trouvée pour cette demande"));

            // 3. Check if request is already approved or rejected
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

            // 4. Verify validator
            Validator validationInfo = validatorRepository.findByChefId(chefId)
                    .stream()
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Ce chef n'est pas validateur"));

            // 5. Update based on validator's weight
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
            }

            // 6. Save refusal response
            responseChefsDemCongeRepository.save(response);

            // 7. Update main request status
            demande.setReponseChef(Reponse.N);
            demande.setObservation("Refusé par chef poids " + poidChef + ": " + observation);
            demande.setResponseChefs(response); // Ensure the link is maintained
            demandeCongeRepository.save(demande);

            // 8. Notify employee
            if (demande.getMatPers() != null) {
                notificationService.createNotification(
                        "Votre demande de congé a été refusée",
                        "collaborateur",
                        demande.getMatPers().getId()
                );
            }

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
        return demandeCongeRepository.findById(id).map(demande -> {
            demande.setReponseRH(Reponse.T);
            demande.setObservation(observation); // Set observation if provided
            demandeCongeRepository.save(demande);
            return ResponseEntity.ok("Demande traitée avec succès");
        }).orElse(ResponseEntity.notFound().build());
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


    @GetMapping("/approved")
    public ResponseEntity<?> getDemandesApprovedByChef1() {
        try {
            // 1. Récupérer toutes les réponses où le chef1 a approuvé ("O")
            List<Response_chefs_dem_conge> reponsesChef1 = responseChefsDemCongeRepository.findByResponseChef1("O");

            // 2. Extraire les IDs des demandes approuvées
            List<String> demandeIds = reponsesChef1.stream()
                    .map(Response_chefs_dem_conge::getDemandeId)
                    .collect(Collectors.toList());

            // 3. Récupérer les demandes correspondantes
            List<DemandeConge> demandes = demandeCongeRepository.findByIdIn(demandeIds);

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
    @GetMapping("/collaborateurs-by-service/{chefserviceid}")
    public ResponseEntity<?> getDemandesCongeByService(@PathVariable String chefserviceid) {
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
                    .map(v -> v.getService())
                    .filter(Objects::nonNull)
                    .map(s -> new ObjectId(s.getId()))
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

            List<DemandeConge> demandes = mongoTemplate.find(
                    new Query(Criteria.where("matPers.$id").in(personnelIds))
                            .with(Sort.by(Sort.Direction.DESC, "dateDemande")),
                    DemandeConge.class
            );

            // 7. Prepare response
            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "chef", buildPersonnelMap(chef),
                    "services", buildServiceList(chefValidators),
                    "statistics", buildStatistics(servicePersonnel, demandes),
                    "demandes", buildDemandeList(demandes),
                    "debug", buildDebugInfo(serviceIds, servicePersonnel)
            ));

        } catch (Exception e) {
            log.error("Error in getDemandesCongeByService: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "status", "error",
                    "message", "Erreur technique",
                    "error", e.getMessage()
            ));
        }
    }

    // Helper methods
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
        return validators.stream()
                .filter(v -> v.getService() != null)
                .map(v -> {
                    Map<String, Object> serviceMap = new LinkedHashMap<>();
                    serviceMap.put("id", v.getService().getId());
                    serviceMap.put("name", v.getService().getServiceName());
                    serviceMap.put("poid", v.getPoid());
                    return serviceMap;
                })
                .collect(Collectors.toList());
    }

    private Map<String, Object> buildStatistics(List<Personnel> personnel, List<DemandeConge> demandes) {
        return Map.of(
                "totalPersonnel", personnel.size(),
                "demandes", demandes.size(),
                "roles", personnel.stream()
                        .collect(Collectors.groupingBy(
                                Personnel::getRole,
                                Collectors.counting()
                        ))
        );
    }

    private List<Map<String, Object>> buildDemandeList(List<DemandeConge> demandes) {
        return demandes.stream()
                .map(d -> {
                    Map<String, Object> demandeMap = new LinkedHashMap<>();
                    demandeMap.put("id", d.getId());
                    demandeMap.put("dateDemande", d.getDateDemande());
                    demandeMap.put("dateDebut", d.getDateDebut());
                    demandeMap.put("dateFin", d.getDateFin());
                    demandeMap.put("typeConge", d.getTypeDemande());
                    demandeMap.put("reponseChef", d.getResponseChefs());
                    demandeMap.put("reponseRH", d.getReponseRH());
                    demandeMap.put("texteDemande", d.getTexteDemande());
                    demandeMap.put("observation", d.getObservation());
                    demandeMap.put("codeSoc", d.getCodeSoc());
                    demandeMap.put("snjTempDep", d.getSnjTempDep());
                    demandeMap.put("snjTempRetour", d.getSnjTempRetour());
                    demandeMap.put("nbrJours", d.getNbrJours());

                    // Infos du personnel demandeur
                    if (d.getMatPers() != null) {
                        demandeMap.put("demandeur", buildPersonnelMap(d.getMatPers()));
                    }

                    // Fichiers joints
                    if (d.getFiles() != null && !d.getFiles().isEmpty()) {
                        List<Map<String, Object>> fileList = d.getFiles().stream()
                                .map(file -> {
                                    Map<String, Object> fileMap = new LinkedHashMap<>();
                                    fileMap.put("id", defaultIfNull(file.getId(), ""));
                                    fileMap.put("fileId", defaultIfNull(file.getFileId(), ""));
                                    fileMap.put("filename", defaultIfNull(file.getFilename(), ""));
                                    fileMap.put("fileType", defaultIfNull(file.getFileType(), ""));
                                    return fileMap;
                                })

                                .collect(Collectors.toList());

                        demandeMap.put("files", fileList);
                    } else {
                        demandeMap.put("files", Collections.emptyList());
                    }

                    return demandeMap;
                })
                .collect(Collectors.toList());
    }


    private Map<String, Object> buildDebugInfo(List<ObjectId> serviceIds, List<Personnel> personnel) {
        return Map.of(
                "serviceIds", serviceIds.stream().map(ObjectId::toString).collect(Collectors.toList()),
                "personnelSample", personnel.isEmpty() ? "none" :
                        personnel.subList(0, Math.min(3, personnel.size())).stream()
                                .map(this::buildPersonnelMap)
                                .collect(Collectors.toList())
        );
    }

    private Map<String, Object> convertDemandeToMap(DemandeConge d) {
        try {
            Map<String, Object> map = new LinkedHashMap<>();

            // Basic fields
            map.put("id_libre_demande", d.getId());
            map.put("dateDemande", d.getDateDemande());
            map.put("typeDemande", d.getTypeDemande());
            map.put("codeSoc", d.getCodeSoc());
            map.put("dateDebut", d.getDateDebut());
            map.put("dateFin", d.getDateFin());
            map.put("nbrJours", d.getNbrJours());
            map.put("year", d.getYear());
            map.put("reponseChef", d.getResponseChefs());
            map.put("reponseRH", d.getReponseRH());

            // Optional fields (only include if not null)
            Optional.ofNullable(d.getTexteDemande()).ifPresent(v -> map.put("texteDemande", v));
            Optional.ofNullable(d.getObservation()).ifPresent(v -> map.put("observation", v));
            Optional.ofNullable(d.getSnjTempDep()).ifPresent(v -> map.put("snjTempDep", v));
            Optional.ofNullable(d.getSnjTempRetour()).ifPresent(v -> map.put("snjTempRetour", v));

            // Personnel information
            map.put("matPers", Optional.ofNullable(d.getMatPers())
                    .map(p -> Map.of(
                            "id", p.getId(),
                            "matricule", defaultIfNull(p.getMatricule(), ""),
                            "nom", defaultIfNull(p.getNom(), ""),
                            "prenom", defaultIfNull(p.getPrenom(), ""),
                            "email", defaultIfNull(p.getEmail(), "")
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
            log.error("Error converting demande {} to map: {}", d.getId(), e.getMessage());
            return null;
        }
    }

    private String defaultIfNull(String value, String defaultValue) {
        return value != null ? value : defaultValue;
    }    @GetMapping("/days-used/{matPersId}")
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

 /*   @GetMapping("/collaborateurs-by-service/{chefserviceid}/approved")
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
    }*/

}