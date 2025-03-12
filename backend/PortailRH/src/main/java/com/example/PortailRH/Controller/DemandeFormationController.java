package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.*;
import com.example.PortailRH.Repository.*;
import com.example.PortailRH.Service.DemandeFormationService;
import com.example.PortailRH.Service.FichierJointService;
import com.example.PortailRH.Service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/demande-formation")
public class DemandeFormationController {

    @Autowired
    private TitreRepository titreRepository;

    @Autowired
    private TypeRepository typeRepository;

    @Autowired
    private ThemeRepository themeRepository;

    @Autowired
    private DemandeFormationService demandeFormationService;

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

            @RequestParam(value = "file", required = false) MultipartFile file, // Fichier facultatif
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

            // Set the Personnel object based on matPersId
            Personnel matPers = new Personnel();
            matPers.setId(matPersId);
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

            // Handle the file upload only if a file is provided
            if (file != null && !file.isEmpty()) {
                Fichier_joint fichier = fichierJointService.saveFile(file);
                demandeFormation.getFiles().add(fichier);
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

            // Save the request
            DemandeFormation createdDemande = demandeFormationService.createDemandeFormation(demandeFormation);
            sseController.sendUpdate("created", createdDemande);

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Demande de congé créée avec succès",
                    "demandeId", createdDemande.getId_libre_demande()
            ));
        } catch (ParseException e) {
            return new ResponseEntity<>("Format de date invalide.", HttpStatus.BAD_REQUEST);
        } catch (IOException e) {
            return new ResponseEntity<>("Erreur lors du traitement du fichier.", HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
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
    @PutMapping("/valider/{id}")
    public ResponseEntity<String> validerDemande(@PathVariable String id) {
        return demandeFormationRepository.findById(id).map(demande -> {
            demande.setReponseChef(Reponse.O);
            demandeFormationRepository.save(demande);
            return ResponseEntity.ok("Demande validée avec succès");
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/refuser/{id}")
    public ResponseEntity<String> refuserDemande(@PathVariable String id) {
        return demandeFormationRepository.findById(id).map(demande -> {
            demande.setReponseChef(Reponse.N);
            demandeFormationRepository.save(demande);
            return ResponseEntity.ok("Demande refusée avec succès");
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/traiter/{id}")
    public ResponseEntity<String> traiterDemande(@PathVariable String id) {
        return demandeFormationRepository.findById(id).map(demande -> {
            demande.setReponseRH(Reponse.T);
            demandeFormationRepository.save(demande);
            return ResponseEntity.ok("Demande traitée avec succès");
        }).orElse(ResponseEntity.notFound().build());
    }
}