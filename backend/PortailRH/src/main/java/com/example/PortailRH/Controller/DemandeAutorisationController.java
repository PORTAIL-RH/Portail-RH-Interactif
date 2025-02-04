package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.DemandeAutorisation;
import com.example.PortailRH.Model.Fichier_joint;
import com.example.PortailRH.Repository.DemandeAutorisationRepository;
import com.example.PortailRH.Service.FichierJointService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/demande-autorisation")
public class DemandeAutorisationController {

    @Autowired
    private DemandeAutorisationRepository demandeAutorisationRepository;

    @Autowired
    private FichierJointService fichierJointService;

    @PostMapping("/create")
    public ResponseEntity<DemandeAutorisation> createDemande(
            @RequestPart("demande") DemandeAutorisation demandeAutorisation,
            @RequestPart(value = "file", required = false) MultipartFile file) {

        try {
            if (demandeAutorisation.getFiles() == null) {
                demandeAutorisation.setFiles(new ArrayList<>());
            }

            if (file != null && !file.isEmpty()) {
                Fichier_joint fichierJoint = fichierJointService.saveFile(file);
                demandeAutorisation.getFiles().add(fichierJoint);
            }

            DemandeAutorisation savedDemande = demandeAutorisationRepository.save(demandeAutorisation);
            return ResponseEntity.ok(savedDemande);

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(null);
        }
    }



// Endpoint pour récupérer toutes les demandes d'autorisation
    @GetMapping
    public ResponseEntity<List<DemandeAutorisation>> getAllDemandes() {
        List<DemandeAutorisation> demandes = demandeAutorisationRepository.findAll();
        return ResponseEntity.ok(demandes);
    }

    // Endpoint pour récupérer une demande par son ID
    @GetMapping("/{id}")
    public ResponseEntity<DemandeAutorisation> getDemandeById(@PathVariable String id) {
        Optional<DemandeAutorisation> demande = demandeAutorisationRepository.findById(id);
        return demande.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Endpoint pour mettre à jour une demande d'autorisation
    @PutMapping("/{id}")
    public ResponseEntity<DemandeAutorisation> updateDemande(@PathVariable String id, @RequestBody DemandeAutorisation demandeAutorisation) {
        if (demandeAutorisationRepository.existsById(id)) {
            demandeAutorisation.setId_libre_demande(id);
            DemandeAutorisation updatedDemande = demandeAutorisationRepository.save(demandeAutorisation);
            return ResponseEntity.ok(updatedDemande);
        }
        return ResponseEntity.notFound().build();
    }

    // Endpoint pour supprimer une demande d'autorisation
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDemande(@PathVariable String id) {
        if (demandeAutorisationRepository.existsById(id)) {
            demandeAutorisationRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
