package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.Candidature;
import com.example.PortailRH.Repository.CandidatureRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/candidatures")
public class CandidatureController {

    @Autowired
    private CandidatureRepository candidatureRepository;

    // Create a new Candidature
    @PostMapping
    public Candidature createCandidature(@RequestBody Candidature candidature) {
        // Définir la date d'ajout de la postulation
        candidature.setDateAjoutPostulation(new Date());
        // Sauvegarder la candidature (le statut sera calculé dynamiquement via getStatus())
        return candidatureRepository.save(candidature);
    }

    // Get all Candidatures
    @GetMapping
    public List<Candidature> getAllCandidatures() {
        // Récupérer toutes les candidatures
        return candidatureRepository.findAll();
    }

    // Get a Candidature by ID
    @GetMapping("/{id}")
    public ResponseEntity<Candidature> getCandidatureById(@PathVariable String id) {
        // Récupérer une candidature par son ID
        Optional<Candidature> candidature = candidatureRepository.findById(id);
        return candidature.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Update a Candidature
    @PutMapping("/{id}")
    public ResponseEntity<Candidature> updateCandidature(@PathVariable String id, @RequestBody Candidature candidatureDetails) {
        // Vérifier si la candidature existe
        Optional<Candidature> candidatureOptional = candidatureRepository.findById(id);
        if (candidatureOptional.isPresent()) {
            Candidature candidature = candidatureOptional.get();

            // Mettre à jour les champs de la candidature
            candidature.setDateAjoutPostulation(candidatureDetails.getDateAjoutPostulation());
            candidature.setDateFermeturePostulation(candidatureDetails.getDateFermeturePostulation());
            candidature.setEmplacement(candidatureDetails.getEmplacement());
            candidature.setDescription(candidatureDetails.getDescription());
            candidature.setService(candidatureDetails.getService());
            candidature.setAnneeExperiences(candidatureDetails.getAnneeExperiences());
            candidature.setExigences(candidatureDetails.getExigences());
            candidature.setSkills(candidatureDetails.getSkills());

            // Sauvegarder la candidature mise à jour
            Candidature updatedCandidature = candidatureRepository.save(candidature);
            return ResponseEntity.ok(updatedCandidature);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // Delete a Candidature
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCandidature(@PathVariable String id) {
        // Vérifier si la candidature existe avant de la supprimer
        if (candidatureRepository.existsById(id)) {
            candidatureRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}