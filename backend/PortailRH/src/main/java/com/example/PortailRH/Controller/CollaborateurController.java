package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.Collaborateur;
import com.example.PortailRH.Repository.CollaborateurRepository;
import com.example.PortailRH.Service.NotificationService;
import com.example.PortailRH.Util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@RestController
@RequestMapping("/api/Collaborateur")
public class CollaborateurController {

    @Autowired
    private BCryptPasswordEncoder bCryptPasswordEncoder;

    @Autowired
    private CollaborateurRepository collaborateurRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private NotificationService notificationService;


    @PostMapping("/register")
    public ResponseEntity<String> registerCollaborateur(@RequestBody Collaborateur collaborateur) {
        // Password confirmation check
        if (!collaborateur.isPasswordConfirmed()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Les mots de passe ne correspondent pas.");
        }

        // Check if email already exists
        if (collaborateurRepository.findByEmail(collaborateur.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("L'adresse e-mail est déjà utilisée.");
        }

        // Check if matricule already exists
        if (collaborateurRepository.findByMatricule(collaborateur.getMatricule()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Le matricule est déjà utilisé.");
        }

        // Hash the password
        collaborateur.setMotDePasse(bCryptPasswordEncoder.encode(collaborateur.getMotDePasse()));
        collaborateur.setConfirmationMotDePasse(null); // Clear the confirmation password
        collaborateur.setActive(false);  // Account is not active initially
        collaborateur.setRole(Set.of("Collaborateur"));

        // Save the collaborateur
        collaborateurRepository.save(collaborateur);

        // Generate JWT token (send token on successful registration)
        String token = jwtUtil.generateToken(collaborateur.getEmail());

        // Return success response with the token
        return ResponseEntity.ok().body("Collaborateur enregistré avec succès. En attente d'activation. Token: " + token);
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllCollaborateurs() {
        try {
            return ResponseEntity.ok(collaborateurRepository.findAll());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la récupération des collaborateurs.");
        }
    }


    // Login Endpoint
    @PostMapping("/login")
    public ResponseEntity<?> loginCollaborateur(@RequestBody Collaborateur collaborateur) {
        // Fetch the existing collaborateur based on matricule
        Collaborateur existingCollaborateur = collaborateurRepository.findByMatricule(collaborateur.getMatricule())
                .orElse(null);

        // Check if collaborateur exists and is active
        if (existingCollaborateur == null || !existingCollaborateur.isActive()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Matricule introuvable ou compte inactif.");
        }

        // Validate password
        if (!bCryptPasswordEncoder.matches(collaborateur.getMotDePasse(), existingCollaborateur.getMotDePasse())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Mot de passe incorrect.");
        }

        // Generate JWT token
        String token = jwtUtil.generateToken(existingCollaborateur.getEmail());

        // Return success response with the token
        return ResponseEntity.ok().body("Connexion réussie ! Token : " + token);
    }
}