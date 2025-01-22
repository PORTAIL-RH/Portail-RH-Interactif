package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.LoginResponse;
import com.example.PortailRH.Model.Personnel;
import com.example.PortailRH.Repository.PersonnelRepository;
import com.example.PortailRH.Service.NotificationService;
import com.example.PortailRH.Util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

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

    // Register a new personnel
    @PostMapping("/register")
    public ResponseEntity<?> registerCollaborateur(@RequestBody Personnel personnel) {
        try {
            // Validate matricule format (exactly 5 digits)
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

            // Send a notification
            notificationService.createNotification("Un nouveau Personnel enregistré : " + personnel.getNom() + " " + personnel.getPrenom());

            // Generate JWT token
            String token = jwtUtil.generateToken(personnel.getEmail());

            return ResponseEntity.ok("Collaborateur enregistré avec succès. En attente d'activation. Token: " + token);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de l'enregistrement : " + ex.getMessage());
        }
    }

    // Retrieve all personnel
    @GetMapping("/all")
    public ResponseEntity<?> getAllCollaborateurs() {
        try {
            return ResponseEntity.ok(personnelRepository.findAll());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la récupération des collaborateurs.");
        }
    }

    // Login a personnel
    @PostMapping("/login")
    public ResponseEntity<?> loginCollaborateur(@RequestBody Personnel personnel) {
        try {
            Personnel existingPersonnel = personnelRepository.findByMatricule(personnel.getMatricule())
                    .orElse(null);

            if (existingPersonnel == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Matricule introuvable.");
            }

            if (!existingPersonnel.isActive()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Compte inactif.");
            }

            if (!bCryptPasswordEncoder.matches(personnel.getMotDePasse(), existingPersonnel.getMotDePasse())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Mot de passe incorrect.");
            }

            // Generate JWT token
            String token = jwtUtil.generateToken(existingPersonnel.getMatricule());

            // Include 'id' in the response body along with the token
            return ResponseEntity.ok(new LoginResponse(token, existingPersonnel.getId()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de la connexion : " + ex.getMessage());
        }
    }

    @PostMapping("/update")
    public ResponseEntity<?> updatePersonnel(@RequestBody Map<String, Object> payload) {
        try {
            String userId = payload.get("userId").toString();
            Personnel personnel = personnelRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            personnel.setSexe((String) payload.get("sexe"));
            personnel.setDate_naiss((String) payload.get("dateNaissance"));
            personnel.setSituation((String) payload.get("situation"));
            personnel.setTelephone((String) payload.get("phone"));
            personnel.setNbr_enfants(Integer.parseInt(payload.get("nbrEnfants").toString()));
            personnel.setCIN((String) payload.get("cin"));

            personnelRepository.save(personnel);
            return ResponseEntity.ok("Données mises à jour avec succès.");
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la mise à jour : " + ex.getMessage());
        }
    }

}
