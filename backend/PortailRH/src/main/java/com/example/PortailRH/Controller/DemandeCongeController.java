package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.*;
import com.example.PortailRH.Repository.PersonnelRepository;
import com.example.PortailRH.Service.FichierJointService;
import com.example.PortailRH.Repository.DemandeCongeRepository;
import com.example.PortailRH.Repository.FichierJointRepository;
import com.example.PortailRH.Service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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
import java.util.concurrent.TimeUnit;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/demande-conge")
public class DemandeCongeController {
    @Autowired
    private SseController sseController;
    @Autowired
    private DemandeCongeRepository demandeCongeRepository;

    @Autowired
    private FichierJointRepository fichierJointRepository;

    @Autowired
    private FichierJointService fichierJointService;
    @Autowired
    private NotificationService notificationService;
    @Autowired
    private PersonnelRepository personnelRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate; // Inject SimpMessagingTemplate
    // 1. Get all demands
    @GetMapping
    public List<DemandeConge> getAllDemandes() {
        return demandeCongeRepository.findAll();
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
            @RequestParam("dateDebut") String dateDebut,
            @RequestParam("dateFin") String dateFin,
            @RequestParam("texteDemande") String texteDemande,
            @RequestParam("snjTempDep") String snjTempDep,
            @RequestParam("snjTempRetour") String snjTempRetour,
            @RequestParam("codeSoc") String codeSoc,
            @RequestParam(value = "file", required = false) MultipartFile file, // Fichier facultatif
            @RequestParam("matPersId") String matPersId,
            @RequestParam("nbrJours") String nbrJours) {

        try {
            // Validate and parse dates
            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
            Date startDate = dateFormat.parse(dateDebut);
            Date endDate = dateFormat.parse(dateFin);

            if (startDate.after(endDate)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "La date de début doit être avant la date de fin."
                ));
            }

            // Handle the file upload (if any)
            Fichier_joint fichier = null;
            if (file != null && !file.isEmpty()) {
                fichier = fichierJointService.saveFile(file);
            }

            // Validate and parse the number of days
            int days;
            try {
                days = Integer.parseInt(nbrJours);
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Le nombre de jours n'est pas valide."
                ));
            }

            // Calculate the reprise date based on the nbrJours
            Date dateReprise = new Date(endDate.getTime() + TimeUnit.DAYS.toMillis(days));

            // Create the demande de congé
            DemandeConge demande = new DemandeConge();
            demande.setDateDebut(startDate);
            demande.setDateFin(endDate);
            demande.setTexteDemande(texteDemande);
            demande.setSnjTempDep(snjTempDep);
            demande.setSnjTempRetour(snjTempRetour);
            demande.setTypeDemande("congé");

            // Set the Personnel object based on matPersId and codeSoc
            Personnel matPers = new Personnel();
            matPers.setId(matPersId);
            matPers.setCode_soc(codeSoc);
            demande.setMatPers(matPers);
            demande.setCodeSoc(codeSoc);

            demande.setNbrJours(days);

            // Associate the file with the request (if any)
            if (fichier != null) {
                demande.setFiles(List.of(fichier));
            }

            // Save the request
            DemandeConge savedDemande = demandeCongeRepository.save(demande);


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
                        notificationService.createNotification(notificationMessageChef, "Chef Hiérarchique", servicePersonnel.getServiceId());
                    } else {
                        System.out.println("Chef Hiérarchique not found for service: " + servicePersonnel.getServiceName());
                    }
                } else {
                    System.out.println("Service not found for personnel: " + personnelDetails.getNom() + " " + personnelDetails.getPrenom());
                }
            }
            sseController.sendUpdate("created", savedDemande);

            // Return a JSON response
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Demande de congé créée avec succès",
                    "demandeId", savedDemande.getId()
            ));

        } catch (ParseException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Format de date invalide. Utilisez le format yyyy-MM-dd."
            ));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "message", "Erreur lors du traitement du fichier."
            ));
        }
    }

    // 4. Update a demand
    @PutMapping("/{id}")
    public ResponseEntity<?> updateDemande(
            @PathVariable String id,
            @RequestBody DemandeConge demandeUpdated
    ) {
        return demandeCongeRepository.findById(id).map(existingDemande -> {
            // Update fields with null checks
            if (demandeUpdated.getDateDebut() != null) {
                existingDemande.setDateDebut(demandeUpdated.getDateDebut());
            }
            if (demandeUpdated.getDateFin() != null) {
                existingDemande.setDateFin(demandeUpdated.getDateFin());
            }
            if (demandeUpdated.getTypeDemande() != null) {
                existingDemande.setTypeDemande(demandeUpdated.getTypeDemande());
            }
            if (demandeUpdated.getTexteDemande() != null) {
                existingDemande.setTexteDemande(demandeUpdated.getTexteDemande());
            }
            if (demandeUpdated.getReponseChef() != null) {
                existingDemande.setReponseChef(demandeUpdated.getReponseChef());
            }
            if (demandeUpdated.getReponseRH() != null) {
                existingDemande.setReponseRH(demandeUpdated.getReponseRH());
            }

            // Save and return the updated demande
            DemandeConge updated = demandeCongeRepository.save(existingDemande);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDemande(@PathVariable String id) {
        if (!demandeCongeRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        demandeCongeRepository.deleteById(id);
        return ResponseEntity.noContent().build();
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
    public ResponseEntity<String> validerDemande(@PathVariable String id) {
        return demandeCongeRepository.findById(id).map(demande -> {
            demande.setReponseChef(Reponse.O);
            demandeCongeRepository.save(demande);

            // Supposons que la demande a un champ collaborateurId
            String collaborateurId = demande.getCollaborateurId();
            String message = "Votre demande de Congé a été validée.";
            String role = "collaborateur"; // ou un rôle spécifique si nécessaire
            String serviceId = collaborateurId; // Utiliser collaborateurId comme serviceId pour cibler l'utilisateur

            // Créer et envoyer la notification
            notificationService.createNotification(message, role, serviceId);

            return ResponseEntity.ok("Demande validée avec succès");
        }).orElse(ResponseEntity.notFound().build());
    }


    @PutMapping("/refuser/{id}")
    public ResponseEntity<String> refuserDemande(@PathVariable String id) {
        return demandeCongeRepository.findById(id).map(demande -> {
            demande.setReponseChef(Reponse.N);
            demandeCongeRepository.save(demande);

            // Supposons que la demande a un champ collaborateurId
            String collaborateurId = demande.getCollaborateurId();
            String message = "Votre demande de congé a été validée.";
            String role = "collaborateur"; // ou un rôle spécifique si nécessaire
            String serviceId = collaborateurId; // Utiliser collaborateurId comme serviceId pour cibler l'utilisateur

            // Créer et envoyer la notification
            notificationService.createNotification(message, role, serviceId);

            return ResponseEntity.ok("Demande refusée avec succès");
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/traiter/{id}")
    public ResponseEntity<String> traiterDemande(@PathVariable String id) {
        return demandeCongeRepository.findById(id).map(demande -> {
            demande.setReponseRH(Reponse.T);
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
                    Map<String, Object> dateMap = new HashMap<>();
                    dateMap.put("dateDebut", demande.getDateDebut());
                    dateMap.put("dateFin", demande.getDateFin());
                    dateMap.put("employee", demande.getMatPers());
                    return dateMap;
                })
                .toList();

        return ResponseEntity.ok(result);
    }
}