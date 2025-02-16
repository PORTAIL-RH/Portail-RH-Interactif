package com.example.PortailRH.Controller;

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


    @PostMapping("/create")
    public DemandePreAvance createDemande(@RequestBody DemandePreAvance demandePreAvance) {
        demandePreAvance.setDateDemande(new java.util.Date()); // Définir la date actuelle
        return demandePreAvanceRepository.save(demandePreAvance);
    }

    @GetMapping
    public ResponseEntity<List<DemandePreAvance>> getAllDemandes() {
        List<DemandePreAvance> demandes = demandePreAvanceRepository.findAll();
        return ResponseEntity.ok(demandes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DemandePreAvance> getDemandeById(@PathVariable String id) {
        Optional<DemandePreAvance> demande = demandePreAvanceRepository.findById(id);
        return demande.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDemande(@PathVariable String id, @RequestBody DemandePreAvance demandePreAvance) {
        if (!demandePreAvanceRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        demandePreAvance.setId(id);
        demandePreAvanceRepository.save(demandePreAvance);
        return ResponseEntity.ok("Demande mise à jour avec succès");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDemande(@PathVariable String id) {
        if (!demandePreAvanceRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        demandePreAvanceRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/personnel/{matPersId}")
    public ResponseEntity<List<DemandePreAvance>> getDemandesByPersonnelId(@PathVariable String matPersId) {
        List<DemandePreAvance> demandes = demandePreAvanceRepository.findByMatPers_Id(matPersId);
        return demandes.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(demandes);
    }
}