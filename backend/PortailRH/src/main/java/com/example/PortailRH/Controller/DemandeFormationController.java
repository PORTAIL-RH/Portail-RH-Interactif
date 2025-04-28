package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.*;
import com.example.PortailRH.Repository.*;
import com.example.PortailRH.Service.DemandeFormationService;
import com.example.PortailRH.Service.FichierJointService;
import com.example.PortailRH.Service.NotificationService;
import org.bson.types.ObjectId;
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
import java.util.*;

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

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDemande(@PathVariable String id) {
        System.out.println("[DEBUG] Delete request for ID: " + id);

        try {
            // Convert to ObjectId for proper querying
            ObjectId objectId = new ObjectId(id); // This will validate the ID format
            String idString = objectId.toString();

            // Debugging output
            System.out.println("[DEBUG] Converted ID: " + idString);
            System.out.println("[DEBUG] Repository count: " + demandeFormationRepository.count());

            // Check existence
            Optional<DemandeFormation> doc = demandeFormationRepository.findById(idString);
            if (doc.isEmpty()) {
                System.out.println("[DEBUG] Document not found");
                return ResponseEntity.notFound().build();
            }

            // Delete
            demandeFormationRepository.deleteById(idString);
            System.out.println("[DEBUG] Delete successful");
            return ResponseEntity.noContent().build();

        } catch (IllegalArgumentException e) {
            System.out.println("[ERROR] Invalid ID format: " + e.getMessage());
            return ResponseEntity.badRequest().body("Invalid ID format");
        } catch (Exception e) {
            System.out.println("[ERROR] Delete failed: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Delete failed");
        }
    }
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

            // Supposons que la demande a un champ collaborateurId
            String collaborateurId = demande.getCollaborateurId();
            String message = "Votre demande de formation a été validée.";
            String role = "collaborateur"; // ou un rôle spécifique si nécessaire
            String serviceId = collaborateurId; // Utiliser collaborateurId comme serviceId pour cibler l'utilisateur

            // Créer et envoyer la notification
            notificationService.createNotification(message, role, serviceId);

            return ResponseEntity.ok("Demande validée avec succès");
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/refuser/{id}")
    public ResponseEntity<String> refuserDemande(@PathVariable String id) {
        return demandeFormationRepository.findById(id).map(demande -> {
            demande.setReponseChef(Reponse.N);
            demandeFormationRepository.save(demande);

            // Supposons que la demande a un champ collaborateurId
            String collaborateurId = demande.getCollaborateurId();
            String message = "Votre demande de formation a été refuser.";
            String role = "collaborateur"; // ou un rôle spécifique si nécessaire
            String serviceId = collaborateurId; // Utiliser collaborateurId comme serviceId pour cibler l'utilisateur

            // Créer et envoyer la notification
            notificationService.createNotification(message, role, serviceId);


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


}