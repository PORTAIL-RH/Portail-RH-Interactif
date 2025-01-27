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

import java.util.HashMap;
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

            // Check if there is a personnel associated with the provided matricule
            Personnel existingPersonnel = personnelRepository.findByMatricule(personnel.getMatricule()).orElse(null);

            // Check if the matricule exists and is associated with the correct email
            if (existingPersonnel != null) {
                if (!existingPersonnel.getEmail().equals(personnel.getEmail())) {
                    return ResponseEntity.badRequest().body("L'adresse e-mail ne correspond pas au matricule.");
                }

                // If personnel exists, update their details
                existingPersonnel.setNom(personnel.getNom());
                existingPersonnel.setPrenom(personnel.getPrenom());

                // Check if passwords match and update
                if (!personnel.isPasswordConfirmed()) {
                    return ResponseEntity.badRequest().body("Les mots de passe ne correspondent pas.");
                }
                existingPersonnel.setMotDePasse(bCryptPasswordEncoder.encode(personnel.getMotDePasse()));

                // Set the personnel to inactive by default
                existingPersonnel.setActive(false);

                // Save the updated personnel
                personnelRepository.save(existingPersonnel);

                // Send a notification
                notificationService.createNotification("Le Personnel " + personnel.getNom() + " " + personnel.getPrenom() + " a été mis à jour.");

                // Generate JWT token
                String token = jwtUtil.generateToken(existingPersonnel.getEmail());

                return ResponseEntity.ok("Collaborateur mis à jour avec succès. En attente d'activation. Token: " + token);
            } else {
                // If no existing personnel found, reject the registration
                return ResponseEntity.badRequest().body("Aucun personnel trouvé pour ce matricule.");
            }
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

    // Add a personnel with only matricule and email
    @PostMapping("/addWithMatriculeAndEmail")
    public ResponseEntity<?> addPersonnelWithMatriculeAndEmail(@RequestBody Map<String, String> payload) {
        try {
            String matricule = payload.get("matricule");
            String email = payload.get("email");

            // Validate matricule format (exactly 5 digits)
            if (matricule == null || !matricule.matches("^\\d{5}$")) {
                return ResponseEntity.badRequest().body(Map.of("message", "Le matricule doit être composé de 5 chiffres."));
            }

            // Check if email is provided
            if (email == null || email.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "L'adresse e-mail est obligatoire."));
            }

            // Check if email is already used
            if (personnelRepository.findByEmail(email).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("message", "L'adresse e-mail est déjà utilisée."));
            }

            // Check if matricule is already used
            if (personnelRepository.findByMatricule(matricule).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Le matricule est déjà utilisé."));
            }

            // Create and save the new personnel
            Personnel newPersonnel = new Personnel();
            newPersonnel.setMatricule(matricule);
            newPersonnel.setEmail(email);
            newPersonnel.setActive(false);
            personnelRepository.save(newPersonnel);

            // Send a notification
            notificationService.createNotification("Un nouveau Personnel ajouté avec le matricule : " + matricule);

            // Generate JWT token
            String token = jwtUtil.generateToken(email);

            // Return a JSON response
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Personnel ajouté avec succès. En attente d'activation.");
            response.put("token", token);
            response.put("personnel", newPersonnel);

            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors de l'ajout du personnel : " + ex.getMessage()));
        }
    }

    // Modifier tous les champs d'un personnel
    @PutMapping("/updateAllFields/{id}")
    public ResponseEntity<?> updateAllFields(@PathVariable String id, @RequestBody Map<String, Object> updates) {
        try {
            // Récupérer le personnel par ID
            Personnel personnel = personnelRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Personnel non trouvé avec l'ID : " + id));

            // Mise à jour dynamique des champs
            if (updates.containsKey("matricule")) {
                String matricule = updates.get("matricule").toString();
                if (!matricule.matches("^\\d{5}$")) {
                    return ResponseEntity.badRequest().body("Le matricule doit être composé de 5 chiffres.");
                }
                personnel.setMatricule(matricule);
            }
            if (updates.containsKey("nom")) personnel.setNom(updates.get("nom").toString());
            if (updates.containsKey("prenom")) personnel.setPrenom(updates.get("prenom").toString());
            if (updates.containsKey("email")) personnel.setEmail(updates.get("email").toString());
            if (updates.containsKey("motDePasse")) {
                personnel.setMotDePasse(bCryptPasswordEncoder.encode(updates.get("motDePasse").toString()));
            }
            if (updates.containsKey("confirmationMotDePasse")) {
                personnel.setConfirmationMotDePasse(updates.get("confirmationMotDePasse").toString());
            }
            if (updates.containsKey("date_naiss")) personnel.setDate_naiss(updates.get("date_naiss").toString());
            if (updates.containsKey("telephone")) personnel.setTelephone(updates.get("telephone").toString());
            if (updates.containsKey("CIN")) personnel.setCIN(updates.get("CIN").toString());
            if (updates.containsKey("sexe")) personnel.setSexe(updates.get("sexe").toString());
            if (updates.containsKey("situation")) personnel.setSituation(updates.get("situation").toString());
            if (updates.containsKey("nbr_enfants")) {
                personnel.setNbr_enfants(Integer.parseInt(updates.get("nbr_enfants").toString()));
            }
            if (updates.containsKey("date_embauche")) personnel.setDate_embauche(updates.get("date_embauche").toString());
            if (updates.containsKey("active")) personnel.setActive(Boolean.parseBoolean(updates.get("active").toString()));
            if (updates.containsKey("role")) personnel.setRole(updates.get("role").toString());

            // Sauvegarder les modifications
            personnelRepository.save(personnel);

            return ResponseEntity.ok("Données du personnel mises à jour avec succès.");
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la mise à jour : " + ex.getMessage());
        }
    }



}
