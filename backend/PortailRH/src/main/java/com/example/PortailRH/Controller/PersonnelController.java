package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.Personnel;
import com.example.PortailRH.Repository.PersonnelRepository;
import com.example.PortailRH.Service.NotificationService;
import com.example.PortailRH.Util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@RestController
@RequestMapping("/api/Personnel")
public class PersonnelController {

    @Autowired
    private BCryptPasswordEncoder bCryptPasswordEncoder;

    @Autowired
    private PersonnelRepository personnelRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private NotificationService notificationService;


    @PostMapping("/register")
    public ResponseEntity<?> registerCollaborateur(@RequestBody Personnel personnel) {
        // Validate matricule format (must be exactly 5 digits)
        if (!personnel.getMatricule().matches("^\\d{5}$")) {
            return ResponseEntity.badRequest().body("Le matricule doit être composé de 5 chiffres.");
        }

        // Check if passwords match
        if (!personnel.isPasswordConfirmed()) {
            return ResponseEntity.badRequest().body("Les mots de passe ne correspondent pas.");
        }

        // Check if email is already used
        if (personnelRepository.findByEmail(personnel.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("L'adresse e-mail est déjà utilisée.");
        }

        // Check if matricule is already used
        if (personnelRepository.findByMatricule(personnel.getMatricule()).isPresent()) {
            return ResponseEntity.badRequest().body("Le matricule est déjà utilisé.");
        }

        // Encode the password and save the new personnel
        personnel.setMotDePasse(bCryptPasswordEncoder.encode(personnel.getMotDePasse()));
        personnel.setConfirmationMotDePasse(null);
        personnel.setActive(false);

        personnelRepository.save(personnel);
        notificationService.createNotification("Un nouveau Personnel enregistré : " + personnel.getNom() + " " + personnel.getPrenom());

        // Generate JWT token
        String token = jwtUtil.generateToken(personnel.getEmail());
        return ResponseEntity.ok("Collaborateur enregistré avec succès. En attente d'activation. Token: " + token);
    }


    @GetMapping("/all")
    public ResponseEntity<?> getAllCollaborateurs() {
        try {
            return ResponseEntity.ok(personnelRepository.findAll());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la récupération des collaborateurs.");
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginCollaborateur(@RequestBody Personnel personnel) {
        Personnel existingPersonnel = personnelRepository.findByMatricule(personnel.getMatricule())
                .orElse(null);

        if (existingPersonnel == null ) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Matricule introuvable ");
        }
        if (!existingPersonnel.isActive()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("compte inactif.");
        }

        if (!bCryptPasswordEncoder.matches(personnel.getMotDePasse(), existingPersonnel.getMotDePasse())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Mot de passe incorrect.");
        }

        String token = jwtUtil.generateToken(existingPersonnel.getMatricule());

        return ResponseEntity.ok().body("Connexion réussie ! Token : " + token);
    }
}
