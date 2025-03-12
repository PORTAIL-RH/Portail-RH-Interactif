package com.example.PortailRH.Controller;

import com.example.PortailRH.Exception.MontantDepasseException;
import com.example.PortailRH.Model.*;
import com.example.PortailRH.Repository.DemandePreAvanceRepository;
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

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/demande-pre-avance")
public class DemandePreAvanceController {

    @Autowired
    private DemandePreAvanceRepository demandePreAvanceRepository;
    @Autowired
    private FichierJointService fichierJointService;
    @Autowired
    private NotificationService notificationService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate; // Inject SimpMessagingTemplate
    @Autowired
    private PersonnelRepository personnelRepository;
    @Autowired
    private SseController sseController;
    @GetMapping
    public List<DemandePreAvance> getAllDemandes() {
        return demandePreAvanceRepository.findAll();
    }

    // Create a new DemandePreAvance
    @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createDemande(
            @RequestParam("type") String type,
            @RequestParam("montant") double montant,
            @RequestParam("texteDemande") String texteDemande,
            @RequestParam("matPersId") String matPersId,
            @RequestParam("codeSoc") String codeSoc,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        try {
            System.out.println("Received matPersId: " + matPersId); // Log matPersId

            // Create a new DemandePreAvance object
            DemandePreAvance demandePreAvance = new DemandePreAvance();
            demandePreAvance.setType(type);
            demandePreAvance.setMontant(montant);
            demandePreAvance.setTexteDemande(texteDemande);
            Personnel matPers = new Personnel();
            matPers.setId(matPersId);
            matPers.setCode_soc(codeSoc);
            demandePreAvance.setMatPers(matPers);
            demandePreAvance.setCodeSoc(codeSoc);
            demandePreAvance.setDateDemande(new Date());

            // Validate the montant
            demandePreAvance.validateMontant();

            // Handle file upload (if provided)
            if (file != null && !file.isEmpty()) {
                // Save the file and get the saved Fichier_joint object
                Fichier_joint fichier = fichierJointService.saveFile(file);

                // Ensure the Fichier_joint object is saved and has a valid ID
                if (fichier.getId() == null) {
                    throw new IllegalStateException("Failed to save the file: Fichier_joint ID is null");
                }

                // Associate the file with the demande
                demandePreAvance.setFiles(List.of(fichier));
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

            // Save the demandePreAvance to the database
            DemandePreAvance savedDemande = demandePreAvanceRepository.save(demandePreAvance);
            sseController.sendUpdate("created", savedDemande);

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Demande de congé créée avec succès",
                    "demandeId", savedDemande.getId()
            ));
        } catch (MontantDepasseException e) {
            return ResponseEntity.badRequest().body(e.getMessage()); // Return 400 Bad Request with the exception message
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur lors de la création de la demande: " + e.getMessage());
        }
    }

    // Get the types of pre-avances and their maximum amounts
    @GetMapping("/types")
    public ResponseEntity<Map<String, Double>> getTypesPreAvance() {
        return ResponseEntity.ok(DemandePreAvance.getTypesPreAvance());
    }

    // Get a DemandePreAvance by ID
    @GetMapping("/{id}")
    public ResponseEntity<DemandePreAvance> getDemandeById(@PathVariable String id) {
        Optional<DemandePreAvance> demande = demandePreAvanceRepository.findById(id);
        return demande.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Update a DemandePreAvance by ID
    @PutMapping("/{id}")
    public ResponseEntity<?> updateDemande(@PathVariable String id, @RequestBody DemandePreAvance demandePreAvance) {
        if (!demandePreAvanceRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        demandePreAvance.setId(id); // Ensure the ID is set for the update
        demandePreAvanceRepository.save(demandePreAvance);
        return ResponseEntity.ok("Demande mise à jour avec succès");
    }

    // Delete a DemandePreAvance by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDemande(@PathVariable String id) {
        if (!demandePreAvanceRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        demandePreAvanceRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // Get all DemandePreAvance records for a specific personnel ID
    @GetMapping("/personnel/{matPersId}")
    public ResponseEntity<List<DemandePreAvance>> getDemandesByPersonnelId(@PathVariable String matPersId) {
        List<DemandePreAvance> demandes = demandePreAvanceRepository.findByMatPers_Id(matPersId);
        return demandes.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(demandes);
    }

    // Validate a DemandePreAvance by ID
    @PutMapping("/valider/{id}")
    public ResponseEntity<String> validerDemande(@PathVariable String id) {
        return demandePreAvanceRepository.findById(id).map(demande -> {
            demande.setReponseChef(Reponse.O);
            demandePreAvanceRepository.save(demande);
            return ResponseEntity.ok("Demande validée avec succès");
        }).orElse(ResponseEntity.notFound().build());
    }

    // Refuse a DemandePreAvance by ID
    @PutMapping("/refuser/{id}")
    public ResponseEntity<String> refuserDemande(@PathVariable String id) {
        return demandePreAvanceRepository.findById(id).map(demande -> {
            demande.setReponseChef(Reponse.N);
            demandePreAvanceRepository.save(demande);
            return ResponseEntity.ok("Demande refusée avec succès");
        }).orElse(ResponseEntity.notFound().build());
    }

    // Process a DemandePreAvance by ID
    @PutMapping("/traiter/{id}")
    public ResponseEntity<String> traiterDemande(@PathVariable String id) {
        return demandePreAvanceRepository.findById(id).map(demande -> {
            demande.setReponseRH(Reponse.T);
            demandePreAvanceRepository.save(demande);
            return ResponseEntity.ok("Demande traitée avec succès");
        }).orElse(ResponseEntity.notFound().build());
    }

    // Helper method to save the uploaded file
    private String saveFile(MultipartFile file) {
        // Implement file saving logic here
        // Example: Save the file to a directory or cloud storage and return the file path
        return "path/to/saved/file";
    }
}