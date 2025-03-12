package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.DemandeDocument;
import com.example.PortailRH.Model.Fichier_joint;
import com.example.PortailRH.Model.Personnel;
import com.example.PortailRH.Model.Reponse;
import com.example.PortailRH.Repository.DemandeDocumentRepository;
import com.example.PortailRH.Service.FichierJointService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/demande-document")
public class DemandeDocumentController {
    @Autowired
    private SseController sseController;
    @Autowired
    private DemandeDocumentRepository demandeDocumentRepository;

    @Autowired
    private FichierJointService fichierJointService;

    // Get all demandes
    @GetMapping
    public List<DemandeDocument> getAllDemandes() {
        return demandeDocumentRepository.findAll();
    }

    // Get a demande by ID
    @GetMapping("/{id}")
    public Optional<DemandeDocument> getDemandeById(@PathVariable String id) {
        return demandeDocumentRepository.findById(id);
    }

    // Create a new demande with files for request and response
    @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createDemande(
            @RequestParam("typeDemande") String typeDemande,
            @RequestParam("codeSoc") String codeSoc,
            @RequestParam("texteDemande") String texteDemande,
            @RequestParam(value = "files", required = false) MultipartFile[] files,
            @RequestParam("matPersId") String matPersId,
            @RequestParam("typeDocument") String typeDocument,
            @RequestParam(value = "filesReponse", required = false) MultipartFile[] filesReponse) throws IOException {

        try {
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

            // Handle files for the initial request
            if (files != null && files.length > 0) {
                List<Fichier_joint> fichiers = new ArrayList<>();
                for (MultipartFile file : files) {
                    Fichier_joint fichier = fichierJointService.saveFile(file);
                    fichiers.add(fichier);
                }
                demandeDocument.setFiles(fichiers);
            }

            // Handle files for the response
            if (filesReponse != null && filesReponse.length > 0) {
                List<Fichier_joint> fichiersReponse = new ArrayList<>();
                for (MultipartFile file : filesReponse) {
                    Fichier_joint fichier = fichierJointService.saveFile(file);
                    fichiersReponse.add(fichier);
                }
                demandeDocument.setFilesReponse(fichiersReponse);
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

    // Update an existing demande
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

    // Delete a demande
    @DeleteMapping("/{id}")
    public void deleteDemande(@PathVariable String id) {
        demandeDocumentRepository.deleteById(id);
    }

    // Get demandes by Matricule Personnel
    @GetMapping("/personnel/{matPersId}")
    public List<DemandeDocument> getDemandesByMatPersId(@PathVariable String matPersId) {
        return demandeDocumentRepository.findByMatPersId(matPersId);
    }

    @PutMapping("/valider/{id}")
    public ResponseEntity<String> validerDemande(@PathVariable String id, @RequestBody DemandeDocument demandeDetails) {
        return demandeDocumentRepository.findById(id).map(demande -> {
            // Validate the demande
            demande.setReponseChef(Reponse.O);

            // Ensure filesReponse is not null and contains valid Fichier_joint objects
            if (demandeDetails.getFilesReponse() != null && !demandeDetails.getFilesReponse().isEmpty()) {
                for (Fichier_joint fichier : demandeDetails.getFilesReponse()) {
                    if (fichier.getId() == null) {
                        throw new RuntimeException("Fichier_joint object has a NULL id.");
                    }
                }
                demande.setFilesReponse(demandeDetails.getFilesReponse());
            } else {
                throw new RuntimeException("Aucun fichier réponse fourni.");
            }

            // Save the updated demande
            demandeDocumentRepository.save(demande);
            return ResponseEntity.ok("Demande validée avec succès");
        }).orElse(ResponseEntity.notFound().build());
    }

    // Refuse a demande
    @PutMapping("/refuser/{id}")
    public ResponseEntity<String> refuserDemande(@PathVariable String id) {
        return demandeDocumentRepository.findById(id).map(demande -> {
            demande.setReponseChef(Reponse.N);
            demandeDocumentRepository.save(demande);
            return ResponseEntity.ok("Demande refusée avec succès");
        }).orElse(ResponseEntity.notFound().build());
    }

    // Process a demande
    @PutMapping("/traiter/{id}")
    public ResponseEntity<String> traiterDemande(@PathVariable String id) {
        return demandeDocumentRepository.findById(id).map(demande -> {
            demande.setReponseRH(Reponse.T);
            demandeDocumentRepository.save(demande);
            return ResponseEntity.ok("Demande traitée avec succès");
        }).orElse(ResponseEntity.notFound().build());
    }
}