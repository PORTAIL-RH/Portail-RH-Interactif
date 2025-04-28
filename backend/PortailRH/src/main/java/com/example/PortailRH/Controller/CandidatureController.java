package com.example.PortailRH.Controller;
import java.util.stream.Collectors;
import com.example.PortailRH.Model.Candidature;
import com.example.PortailRH.Repository.CandidatureRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/candidatures")
public class CandidatureController {

    @Autowired
    private CandidatureRepository candidatureRepository;

    // Create a new Candidature with skill percentages
    @PostMapping
    public ResponseEntity<?> createCandidature(@RequestBody Candidature candidature) {
        try {
            // Set creation date
            candidature.setDateAjoutPostulation(new Date());

            // Validate skill percentages
            if (candidature.getSkillsWithPercentage() != null) {
                int totalPercentage = candidature.getSkillsWithPercentage().values()
                        .stream()
                        .mapToInt(Integer::intValue)
                        .sum();

                if (totalPercentage > 100) {
                    return ResponseEntity.badRequest().body("La somme des pourcentages des compétences ne doit pas dépasser 100%");
                }
            }

            Candidature savedCandidature = candidatureRepository.save(candidature);
            return ResponseEntity.status(201).body(savedCandidature);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erreur lors de la création de la candidature: " + e.getMessage());
        }
    }

    // Get all Candidatures
    @GetMapping
    public ResponseEntity<List<Candidature>> getAllCandidatures() {
        try {
            List<Candidature> candidatures = candidatureRepository.findAll();
            return ResponseEntity.ok(candidatures);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }


    @GetMapping("/disponibles")
    public ResponseEntity<List<Candidature>> getCandidaturesDisponibles() {
        try {
            List<Candidature> candidatures = candidatureRepository.findAvailableCandidatures(new Date());
            return ResponseEntity.ok(candidatures);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    // Get a Candidature by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getCandidatureById(@PathVariable String id) {
        try {
            Optional<Candidature> candidature = candidatureRepository.findById(id);
            return candidature.map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erreur lors de la récupération de la candidature");
        }
    }

    // Update a Candidature
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCandidature(@PathVariable String id, @RequestBody Candidature candidatureDetails) {
        try {
            Optional<Candidature> candidatureOptional = candidatureRepository.findById(id);
            if (candidatureOptional.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Candidature existingCandidature = candidatureOptional.get();

            // Validate skill percentages before update
            if (candidatureDetails.getSkillsWithPercentage() != null) {
                int totalPercentage = candidatureDetails.getSkillsWithPercentage().values()
                        .stream()
                        .mapToInt(Integer::intValue)
                        .sum();

                if (totalPercentage > 100) {
                    return ResponseEntity.badRequest().body("La somme des pourcentages des compétences ne doit pas dépasser 100%");
                }
            }

            // Update fields
            existingCandidature.setDateFermeturePostulation(candidatureDetails.getDateFermeturePostulation());
            existingCandidature.setEmplacement(candidatureDetails.getEmplacement());
            existingCandidature.setDescription(candidatureDetails.getDescription());
            existingCandidature.setService(candidatureDetails.getService());
            existingCandidature.setAnneeExperiences(candidatureDetails.getAnneeExperiences());
            existingCandidature.setExigences(candidatureDetails.getExigences());

            // Only update skills if provided
            if (candidatureDetails.getSkillsWithPercentage() != null) {
                existingCandidature.setSkillsWithPercentage(candidatureDetails.getSkillsWithPercentage());
            }

            Candidature updatedCandidature = candidatureRepository.save(existingCandidature);
            return ResponseEntity.ok(updatedCandidature);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erreur lors de la mise à jour de la candidature");
        }
    }

    // Add or update a specific skill with percentage
    @PatchMapping("/{id}/skills")
    public ResponseEntity<?> updateSkillPercentage(
            @PathVariable String id,
            @RequestParam String skillName,
            @RequestParam int percentage) {
        try {
            Optional<Candidature> candidatureOptional = candidatureRepository.findById(id);
            if (candidatureOptional.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            if (percentage <= 0 || percentage > 100) {
                return ResponseEntity.badRequest().body("Le pourcentage doit être entre 1 et 100");
            }

            Candidature existingCandidature = candidatureOptional.get();
            Map<String, Integer> skills = existingCandidature.getSkillsWithPercentage();

            // Calculate new total percentage
            int currentTotal = skills.values().stream().mapToInt(Integer::intValue).sum();
            int currentSkillPercentage = skills.getOrDefault(skillName, 0);
            int newTotal = currentTotal - currentSkillPercentage + percentage;

            if (newTotal > 100) {
                return ResponseEntity.badRequest().body("La somme des pourcentages dépasserait 100%");
            }

            // Update the skill percentage
            skills.put(skillName, percentage);
            existingCandidature.setSkillsWithPercentage(skills);

            Candidature updatedCandidature = candidatureRepository.save(existingCandidature);
            return ResponseEntity.ok(updatedCandidature);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erreur lors de la mise à jour de la compétence");
        }
    }

    // Delete a Candidature
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCandidature(@PathVariable String id) {
        try {
            if (!candidatureRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            candidatureRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erreur lors de la suppression de la candidature");
        }
    }
}