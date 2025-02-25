package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.DemandeDocument;
import com.example.PortailRH.Repository.DemandeDocumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/demande-document")
public class DemandeDocumentController {
    @Autowired
    private DemandeDocumentRepository demandeDocumentRepository;

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


    @PostMapping("/create")
    public DemandeDocument createDemande(@RequestBody DemandeDocument demandeDocument) {
        demandeDocument.setDateDemande(new java.util.Date()); // Définir la date actuelle
        return demandeDocumentRepository.save(demandeDocument);
    }

    // Mettre à jour une demande existante
    @PutMapping("/{id}")
    public DemandeDocument updateDemande(@PathVariable String id, @RequestBody DemandeDocument demandeDetails) {
        return demandeDocumentRepository.findById(id).map(demande -> {
            demande.setTypeDemande(demandeDetails.getTypeDemande());
            demande.setObjet(demandeDetails.getObjet());
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
}