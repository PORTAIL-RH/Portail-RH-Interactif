package com.example.PortailRH.Controller;

import com.example.PortailRH.Exception.MontantDepasseException;
import com.example.PortailRH.Model.DemandePreAvance;
import com.example.PortailRH.Repository.DemandePreAvanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/demande-pre-avance")
public class DemandePreAvanceController {

    @Autowired
    private DemandePreAvanceRepository demandePreAvanceRepository;

    // Create a new DemandePreAvance
    @PostMapping("/create")
    public ResponseEntity<?> createDemande(@RequestBody DemandePreAvance demandePreAvance) {
        try {
            demandePreAvance.setDateDemande(new java.util.Date()); // Set the current date
            demandePreAvance.validateMontant(); // Validate the montant
            DemandePreAvance savedDemande = demandePreAvanceRepository.save(demandePreAvance);
            return ResponseEntity.ok(savedDemande);
        } catch (MontantDepasseException e) {
            return ResponseEntity.badRequest().body(e.getMessage()); // Return 400 Bad Request with the exception message
        } catch (Exception e) {
            return ResponseEntity.badRequest().build(); // Return 400 Bad Request for other exceptions
        }
    }
    // Get all DemandePreAvance records
    @GetMapping
    public ResponseEntity<List<DemandePreAvance>> getAllDemandes() {
        List<DemandePreAvance> demandes = demandePreAvanceRepository.findAll();
        return ResponseEntity.ok(demandes);
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
}