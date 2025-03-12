package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.*;
import com.example.PortailRH.Repository.DemandeDocumentRepository;
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

import java.io.IOException;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/demande-document")
public class DemandeDocumentController {
    @Autowired
    private DemandeDocumentRepository demandeDocumentRepository;
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
    // Récupérer toutes les demandes
    @GetMapping
    public List<DemandeDocument> getAllDemandes() {
        return demandeDocumentRepository.findAll();
    }

    // Récupérer une demande par ID
    @GetMapping("/{id}")
    public Optional<DemandeDocument> getDemandeById(@PathVariable String id) {
        return demandeDocumentRepository.findById(id);
    }


    @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createDemande(
            @RequestParam("typeDemande") String typeDemande,
            @RequestParam("codeSoc") String codeSoc,
            @RequestParam("texteDemande") String texteDemande,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam("matPersId") String matPersId,
            @RequestParam("typeDocument") String typeDocument) {

        try {
            System.out.println("Received matPersId: " + matPersId); // Log matPersId

            // Create a new DemandeDocument object
            DemandeDocument demandeDocument = new DemandeDocument();
            demandeDocument.setTypeDemande(typeDemande);
            demandeDocument.setCodeSoc(codeSoc);
            demandeDocument.setTexteDemande(texteDemande);


            // Fetch or create Personnel object
            Personnel matPers = new Personnel();
            matPers.setId(matPersId);
            matPers.setCode_soc(codeSoc);
            demandeDocument.setMatPers(matPers);

            demandeDocument.setTypeDocument(typeDocument);
            demandeDocument.setDateDemande(new Date());

            // Handle file upload (if file is provided)
            if (file != null && !file.isEmpty()) {
                Fichier_joint fichier = fichierJointService.saveFile(file);
                demandeDocument.getFiles().add(fichier); // Assuming DemandeDocument has a List<Fichier_joint> field
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

            // Save the DemandeDocument object
            DemandeDocument createdDemande = demandeDocumentRepository.save(demandeDocument);
            sseController.sendUpdate("created", createdDemande);

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Demande de congé créée avec succès",
                    "demandeId", createdDemande.getId()
            ));

        } catch (IOException e) {
            return new ResponseEntity<>("Erreur lors du traitement du fichier.", HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    // Mettre à jour une demande existante
    @PutMapping("/{id}")
    public DemandeDocument updateDemande(@PathVariable String id, @RequestBody DemandeDocument demandeDetails) {
        return demandeDocumentRepository.findById(id).map(demande -> {
            demande.setTypeDemande(demandeDetails.getTypeDemande());
            demande.setTexteDemande(demandeDetails.getTexteDemande());
            demande.setDateDemande(demandeDetails.getDateDemande());
            demande.setReponseChef(demandeDetails.getReponseChef());
            demande.setReponseRH(demandeDetails.getReponseRH());
            return demandeDocumentRepository.save(demande);
        }).orElseThrow(() -> new RuntimeException("Demande non trouvée"));
    }

    // Supprimer une demande
    @DeleteMapping("/{id}")
    public void deleteDemande(@PathVariable String id) {
        demandeDocumentRepository.deleteById(id);
    }

    // Récupérer les demandes par Matricule Personnel
    @GetMapping("/personnel/{matPersId}")
    public List<DemandeDocument> getDemandesByMatPersId(@PathVariable String matPersId) {
        return demandeDocumentRepository.findByMatPersId(matPersId);
    }
    @PutMapping("/valider/{id}")
    public ResponseEntity<String> validerDemande(@PathVariable String id) {
        return demandeDocumentRepository.findById(id).map(demande -> {
            demande.setReponseChef(Reponse.O);
            demandeDocumentRepository.save(demande);
            return ResponseEntity.ok("Demande validée avec succès");
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/refuser/{id}")
    public ResponseEntity<String> refuserDemande(@PathVariable String id) {
        return demandeDocumentRepository.findById(id).map(demande -> {
            demande.setReponseChef(Reponse.N);
            demandeDocumentRepository.save(demande);
            return ResponseEntity.ok("Demande refusée avec succès");
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/traiter/{id}")
    public ResponseEntity<String> traiterDemande(@PathVariable String id) {
        return demandeDocumentRepository.findById(id).map(demande -> {
            demande.setReponseRH(Reponse.T);
            demandeDocumentRepository.save(demande);
            return ResponseEntity.ok("Demande traitée avec succès");
        }).orElse(ResponseEntity.notFound().build());
    }
}