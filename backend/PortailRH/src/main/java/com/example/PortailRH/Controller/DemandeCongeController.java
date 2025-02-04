package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.DemandeConge;
import com.example.PortailRH.Model.Fichier_joint;
import com.example.PortailRH.Repository.DemandeCongeRepository;


import com.example.PortailRH.Repository.FichierJointRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;
@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/demande-conge")
public class DemandeCongeController {

    @Autowired
    private DemandeCongeRepository demandeCongeRepository;

    @Autowired
    private FichierJointRepository fichierJointRepository;

    // 1. Récupérer toutes les demandes
    @GetMapping
    public List<DemandeConge> getAllDemandes() {
        return demandeCongeRepository.findAll();
    }

    // 2. Récupérer une demande par son ID
    @GetMapping("/{id}")
    public ResponseEntity<DemandeConge> getDemandeById(@PathVariable String id) {
        Optional<DemandeConge> demande = demandeCongeRepository.findById(id);
        return demande.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    // 3. Créer une nouvelle demande
    @PostMapping("/create")
    public ResponseEntity<DemandeConge> createDemande(@RequestBody DemandeConge demande) {
        try {
            // Validate matPers and its _id
            if (demande.getMatPers() == null || demande.getMatPers().getId() == null) {
                return ResponseEntity.badRequest().body(null); // 400 Bad Request
            }

            // Validate the dates for logical consistency
            if (demande.getDateDebut() == null || demande.getDateFin() == null || demande.getDateDebut().after(demande.getDateFin())) {
                return ResponseEntity.badRequest().body(null); // 400 Bad Request, Invalid dates
            }

            // Save the demande
            DemandeConge savedDemande = demandeCongeRepository.save(demande);
            return ResponseEntity.ok(savedDemande);
        } catch (Exception e) {
            e.printStackTrace(); // Log the exception
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build(); // 500 Internal Server Error
        }
    }


    // 4. Mettre à jour une demande
    @PutMapping("/{id}")
    public ResponseEntity<DemandeConge> updateDemande(
            @PathVariable String id,
            @RequestBody DemandeConge demandeUpdated
    ) {
        return demandeCongeRepository.findById(id).map(existingDemande -> {
            existingDemande.setDateDebut(demandeUpdated.getDateDebut());
            existingDemande.setDateFin(demandeUpdated.getDateFin());
            existingDemande.setTypeDemande(demandeUpdated.getTypeDemande());
            existingDemande.setTexteDemande(demandeUpdated.getTexteDemande());
            existingDemande.setReponseChef(demandeUpdated.getReponseChef());
            existingDemande.setReponseRH(demandeUpdated.getReponseRH());
            return ResponseEntity.ok(demandeCongeRepository.save(existingDemande));
        }).orElse(ResponseEntity.notFound().build());
    }


    // 6. Ajouter un fichier joint à une demande
    /*
    @PostMapping("/{id}/fichiers")
    public ResponseEntity<DemandeConge> uploadFile(
            @PathVariable String id,
            @RequestParam("file") MultipartFile file
    ) {
        Optional<DemandeConge> optionalDemande = demandeCongeRepository.findById(id);
        if (optionalDemande.isPresent()) {
            DemandeConge demande = optionalDemande.get();
            try {
                // Enregistrer le fichier localement
                String path = "/uploads/" + file.getOriginalFilename();
                Files.write(Paths.get(path), file.getBytes()); // Sauvegarde du fichier sur le serveur local

                // Sauvegarder le fichier dans MongoDB
                Fichier_joint fichierJoint = new Fichier_joint();
                fichierJoint.setFilename(file.getOriginalFilename());
                fichierJoint.setPath(path); // Utiliser le chemin où le fichier est stocké
                fichierJoint.setContentType(file.getContentType());

                fichierJointRepository.save(fichierJoint);

                // Ajouter le fichier à la demande
                demande.getPdfFiles().add(fichierJoint);
                DemandeConge savedDemande = demandeCongeRepository.save(demande);
                return ResponseEntity.ok(savedDemande);
            } catch (IOException e) {
                // En cas d'erreur, renvoyer une réponse avec un code d'erreur mais avec la demande existante
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(demande);
            }
        } else {
            return ResponseEntity.notFound().build();
        }
    }
*/



}