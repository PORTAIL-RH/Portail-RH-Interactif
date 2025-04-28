package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.Societe;
import com.example.PortailRH.Service.SocieteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/societes")
public class SocieteController {

    private final SocieteService societeService;

    @Autowired
    public SocieteController(SocieteService societeService) {
        this.societeService = societeService;
    }

    // Create a new Societe
    @PostMapping
    public ResponseEntity<Societe> createSociete(@RequestBody Societe societe) {
        Societe createdSociete = societeService.createSociete(societe);
        return new ResponseEntity<>(createdSociete, HttpStatus.CREATED);
    }

    // Get all Societes
    @GetMapping
    public ResponseEntity<List<Societe>> getAllSocietes() {
        List<Societe> societes = societeService.getAllSocietes();
        return new ResponseEntity<>(societes, HttpStatus.OK);
    }

    // Update a Societe
    @PutMapping("/{id}")
    public ResponseEntity<Societe> updateSociete(@PathVariable String id, @RequestBody Societe societeDetails) {
        Societe updatedSociete = societeService.updateSociete(id, societeDetails);
        return new ResponseEntity<>(updatedSociete, HttpStatus.OK);
    }

    // Delete a Societe
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSociete(@PathVariable String id) {
        societeService.deleteSociete(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}