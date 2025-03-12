package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.*;
import com.example.PortailRH.Repository.DemandeAutorisationRepository;
import com.example.PortailRH.Repository.PersonnelRepository;
import com.example.PortailRH.Service.FichierJointService;
import com.example.PortailRH.Service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
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
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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
    private SimpMessagingTemplate messagingTemplate; // Inject SimpMessagingTemplate
    @Autowired
    private SseController sseController;

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
                        notificationService.createNotification(notificationMessageChef, "Chef Hiérarchique", servicePersonnel.getServiceId());
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
    public ResponseEntity<?> updateDemande(@PathVariable String id, @RequestBody DemandeAutorisation demandeAutorisation) {
        if (!demandeAutorisationRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        demandeAutorisation.setId(id);
        demandeAutorisationRepository.save(demandeAutorisation);
        return ResponseEntity.ok("Demande mise à jour avec succès");
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
    public ResponseEntity<String> validerDemande(@PathVariable String id) {
        return demandeAutorisationRepository.findById(id).map(demande -> {
            demande.setReponseChef(Reponse.O);
            demandeAutorisationRepository.save(demande);
            return ResponseEntity.ok("Demande validée avec succès");
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/refuser/{id}")
    public ResponseEntity<String> refuserDemande(@PathVariable String id) {
        return demandeAutorisationRepository.findById(id).map(demande -> {
            demande.setReponseChef(Reponse.N);
            demandeAutorisationRepository.save(demande);
            return ResponseEntity.ok("Demande refusée avec succès");
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/traiter/{id}")
    public ResponseEntity<String> traiterDemande(@PathVariable String id) {
        return demandeAutorisationRepository.findById(id).map(demande -> {
            demande.setReponseRH(Reponse.T);
            demandeAutorisationRepository.save(demande);
            return ResponseEntity.ok("Demande traitée avec succès");
        }).orElse(ResponseEntity.notFound().build());
    }

}