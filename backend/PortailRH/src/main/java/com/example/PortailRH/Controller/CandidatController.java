package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.candidat;
import com.example.PortailRH.Model.Candidature;
import com.example.PortailRH.Repository.CandidatRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/candidats")
public class CandidatController {

    @Autowired
    private CandidatRepository candidatRepository;

    private static final String UPLOAD_DIR = "assets/CVS";

    // Get all candidates
    @GetMapping
    public List<candidat> getAllCandidats() {
        return candidatRepository.findAll();
    }

    // Get a candidate by ID
    @GetMapping("/{id}")
    public ResponseEntity<candidat> getCandidatById(@PathVariable String id) {
        Optional<candidat> candidat = candidatRepository.findById(id);
        return candidat.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    // Create a new candidate with CV upload
    @PostMapping
    public ResponseEntity<?> createCandidat(
            @RequestParam String nom,
            @RequestParam String prenom,
            @RequestParam int age,
            @RequestParam String email,
            @RequestParam String numTel,
            @RequestParam String candidatureId,
            @RequestParam("cv") MultipartFile cv) throws IOException {

        // Save the CV file
        String cvFilePath = saveFile(cv);

        // Create a new candidat object
        candidat candidat = new candidat();
        candidat.setNom(nom);
        candidat.setPrenom(prenom);
        candidat.setAge(age);
        candidat.setEmail(email);
        candidat.setNumTel(numTel);
        candidat.setCvFilePath(cvFilePath);

        // Add the candidature
        Candidature candidature = new Candidature();
        candidature.setId(candidatureId);
        candidat.addCandidature(candidature);

        // Save the candidat object
        candidat savedCandidat = candidatRepository.save(candidat);

        return ResponseEntity.ok(savedCandidat);
    }

    private String saveFile(MultipartFile file) throws IOException {
        String uploadDir = "assets/CVS";
        Path uploadPath = Paths.get(uploadDir);

        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath);

        return uploadDir + "/" + fileName;
    }

    // Update a candidate
    @PutMapping("/{id}")
    public ResponseEntity<candidat> updateCandidat(@PathVariable String id, @RequestBody candidat updatedCandidat) {
        return candidatRepository.findById(id)
                .map(candidat -> {
                    candidat.setNom(updatedCandidat.getNom());
                    candidat.setPrenom(updatedCandidat.getPrenom());
                    candidat.setAge(updatedCandidat.getAge());
                    candidat.setEmail(updatedCandidat.getEmail());
                    candidat.setNumTel(updatedCandidat.getNumTel());
                    candidat.setCvFilePath(updatedCandidat.getCvFilePath());
                    candidat savedCandidat = candidatRepository.save(candidat);
                    return ResponseEntity.ok(savedCandidat);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/byCandidature/{candidatureId}")
    public ResponseEntity<candidat> getCandidatByCandidatureId(@PathVariable String candidatureId) {
        List<candidat> candidats = candidatRepository.findByCandidaturesId(candidatureId);
        if (!candidats.isEmpty()) {
            return ResponseEntity.ok(candidats.get(0));

        } else {
            return ResponseEntity.notFound().build();
        }
    }
    // Delete a candidate
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCandidat(@PathVariable String id) {
        if (candidatRepository.existsById(id)) {
            candidatRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}