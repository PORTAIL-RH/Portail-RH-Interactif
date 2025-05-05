package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.*;
import com.example.PortailRH.Repository.DemandeAutorisationRepository;
import com.example.PortailRH.Repository.FichierJointRepository;
import com.example.PortailRH.Repository.PersonnelRepository;
import com.example.PortailRH.Repository.ServiceRepository;
import com.example.PortailRH.Service.FichierJointService;
import com.example.PortailRH.Service.NotificationService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
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
import java.text.ParseException;
import java.text.SimpleDateFormat;
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

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateDemande(
            @PathVariable String id,
            @RequestParam(value = "dateDebut", required = false) String dateDebutStr,
            @RequestParam(value = "texteDemande", required = false) String texteDemande,
            @RequestParam(value = "heureSortie", required = false) String heureSortieStr,
            @RequestParam(value = "heureRetour", required = false) String heureRetourStr,
            @RequestParam(value = "file", required = false) MultipartFile file) {

        return demandeAutorisationRepository.findById(id).map(existingDemande -> {
            try {
                // Update date if provided
                if (dateDebutStr != null && !dateDebutStr.isEmpty()) {
                    SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
                    existingDemande.setDateDebut(dateFormat.parse(dateDebutStr));
                }

                // Update text if provided
                if (texteDemande != null && !texteDemande.isEmpty()) {
                    existingDemande.setTexteDemande(texteDemande);
                }

                // Update departure time if provided
                if (heureSortieStr != null && !heureSortieStr.isEmpty()) {
                    DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
                    LocalTime heureSortie = LocalTime.parse(heureSortieStr, timeFormatter);
                    existingDemande.setHoraireSortie(heureSortie.getHour());
                    existingDemande.setMinuteSortie(heureSortie.getMinute());
                }

                // Update return time if provided
                if (heureRetourStr != null && !heureRetourStr.isEmpty()) {
                    DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
                    LocalTime heureRetour = LocalTime.parse(heureRetourStr, timeFormatter);
                    existingDemande.setHoraireRetour(heureRetour.getHour());
                    existingDemande.setMinuteRetour(heureRetour.getMinute());
                }

                // Handle file upload if provided
                if (file != null && !file.isEmpty()) {
                    // Remove old files if needed
                    if (existingDemande.getFiles() != null && !existingDemande.getFiles().isEmpty()) {
                        fichierJointRepository.deleteAll(existingDemande.getFiles());
                    }

                    // Save new file
                    Fichier_joint fichier = fichierJointService.saveFile(file);
                    existingDemande.setFiles(List.of(fichier));
                }

                // Save the updated demande
                DemandeAutorisation updatedDemande = demandeAutorisationRepository.save(existingDemande);

                return ResponseEntity.ok(Map.of(
                        "message", "Demande d'autorisation mise à jour avec succès",
                        "demandeId", updatedDemande.getId()
                ));

            } catch (ParseException e) {
                return ResponseEntity.badRequest().body("Format de date invalide. Utilisez le format 'yyyy-MM-dd'.");
            } catch (DateTimeParseException e) {
                return ResponseEntity.badRequest().body("Format d'heure invalide. Utilisez le format 'HH:mm'.");
            } catch (IOException e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Erreur lors du traitement du fichier: " + e.getMessage());
            }
        }).orElse(ResponseEntity.notFound().build());
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
            @RequestBody(required = false) TraitementDemandeRequest request) {

        return demandeAutorisationRepository.findById(id).map(demande -> {
            demande.setReponseChef(Reponse.O);

            // Set observation if provided in request body (optional for approval)
            if (request != null && request.getObservation() != null && !request.getObservation().trim().isEmpty()) {
                demande.setObservation(request.getObservation().trim());
            } else {
                demande.setObservation(null); // Clear observation if not provided
            }

            DemandeAutorisation updatedDemande = demandeAutorisationRepository.save(demande);
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
        return demandeAutorisationRepository.findById(id).map(demande -> {
            demande.setReponseChef(Reponse.N);
            demande.setObservation(request.getObservation().trim());

            DemandeAutorisation updatedDemande = demandeAutorisationRepository.save(demande);
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
            // 1. Find service with minimal fields
            Query serviceQuery = new Query();
            serviceQuery.addCriteria(Criteria.where("chefHierarchique.$id").is(new ObjectId(chefserviceid)));
            serviceQuery.fields().include("serviceName");
            Service service = mongoTemplate.findOne(serviceQuery, Service.class);

            if (service == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("status", "error", "message", "Service not found"));
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
                        "service", service.getServiceName(),
                        "demandes", Collections.emptyList()
                ));
            }

            // 3. Get complete demandes but with controlled serialization
            Query demandeQuery = new Query();
            demandeQuery.addCriteria(Criteria.where("matPers.$id").in(collaborateurIds));

            List<DemandeAutorisation> demandes = mongoTemplate.find(demandeQuery, DemandeAutorisation.class);

            // 4. Manual conversion with all attributes
            List<Map<String, Object>> result = demandes.stream()
                    .map(d -> {
                        Map<String, Object> map = new HashMap<>();
                        // Basic fields
                        map.put("id", d.getId());
                        map.put("dateDemande", d.getDateDemande());
                        map.put("typeDemande", d.getTypeDemande());
                        map.put("codeSoc", d.getCodeSoc());
                        map.put("dateDebut", d.getDateDebut());
                        map.put("texteDemande", d.getTexteDemande());
                        map.put("observation", d.getObservation());
                        map.put("reponseChef", d.getReponseChef());
                        map.put("reponseRH", d.getReponseRH());
                        map.put("heureSortie", d.getHeureSortie());
                        map.put("heureRetour", d.getHeureRetour());
                        map.put("horaireSortie", d.getHoraireSortie());
                        map.put("horaireRetour", d.getHoraireRetour());
                        map.put("minuteSortie", d.getMinuteSortie());
                        map.put("minuteRetour", d.getMinuteRetour());
                        map.put("codAutorisation", d.getCodAutorisation());

                        // Handle personnel with cycle protection
                        if (d.getMatPers() != null) {
                            Map<String, Object> personnel = new HashMap<>();
                            personnel.put("id", d.getMatPers().getId());
                            personnel.put("matricule", d.getMatPers().getMatricule());
                            personnel.put("nom", d.getMatPers().getNom());
                            personnel.put("prenom", d.getMatPers().getPrenom());
                            personnel.put("email", d.getMatPers().getEmail());
                            // Add other personnel fields as needed
                            map.put("matPers", personnel);
                        }

                        // Handle files
                        if (d.getFiles() != null) {
                            map.put("files", d.getFiles().stream()
                                    .map(f -> Map.of(
                                            "Id", f.getId(),

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
            log.error("Error fetching demandes: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "status", "error",
                            "message", "Error processing request",
                            "error", e.getMessage()
                    ));
        }
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