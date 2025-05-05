package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.Personnel;
import com.example.PortailRH.Model.PersonnelDTO;
import com.example.PortailRH.Model.Role;
import com.example.PortailRH.Repository.PersonnelRepository;
import com.example.PortailRH.Repository.RoleRepository;
import com.example.PortailRH.Repository.ServiceRepository;
import com.example.PortailRH.Service.EmailService;
import com.example.PortailRH.Service.NotificationService;
import com.example.PortailRH.Util.JwtUtil;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/Personnel")
public class PersonnelController {
    private static final Logger logger = LoggerFactory.getLogger(PersonnelController.class);
    private static final int MAX_REGISTRATION_ATTEMPTS = 3;
    private static final long LOCK_DURATION_MS = 1800000; // 30 minutes
    @Autowired
    private SseController sseController;
    @Autowired
    private BCryptPasswordEncoder bCryptPasswordEncoder;
    @Autowired
    private PersonnelRepository personnelRepository;
    @Autowired
    private ServiceRepository serviceRepository;
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private EmailService emailService;
    @Autowired
    private NotificationService notificationService;

    @Autowired
    private RoleRepository roleRepository;

    // DTO classes for request/response
    public static class LoginRequest {
        private String matricule;
        private String password;

        public String getMatricule() { return matricule; }
        public void setMatricule(String matricule) { this.matricule = matricule; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class RegistrationRequest {
        @NotBlank(message = "Matricule is required")
        @Pattern(regexp = "\\d{5}", message = "Matricule must be 5 digits")
        private String matricule;

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "First name is required")
        private String nom;

        @NotBlank(message = "Last name is required")
        private String prenom;

        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters")
        private String password;

        @NotBlank(message = "Password confirmation is required")
        private String confirmPassword;

        public String getMatricule() { return matricule; }
        public void setMatricule(String matricule) { this.matricule = matricule; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getNom() { return nom; }
        public void setNom(String nom) { this.nom = nom; }
        public String getPrenom() { return prenom; }
        public void setPrenom(String prenom) { this.prenom = prenom; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getConfirmPassword() { return confirmPassword; }
        public void setConfirmPassword(String confirmPassword) { this.confirmPassword = confirmPassword; }
    }

    public static class ResetPasswordRequest {
        private String token;
        private String newPassword;
        private String confirmPassword;

        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
        public String getConfirmPassword() { return confirmPassword; }
        public void setConfirmPassword(String confirmPassword) { this.confirmPassword = confirmPassword; }
    }

    // Registration endpoint with account locking
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegistrationRequest request, HttpSession session) {
        try {
            // 1. Check session-based attempts (for brute-force protection)
            Integer sessionAttempts = (Integer) session.getAttribute("registrationAttempts");
            if (sessionAttempts == null) sessionAttempts = 0;

            if (sessionAttempts >= MAX_REGISTRATION_ATTEMPTS) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
                        "error", "Too many registration attempts",
                        "message", "Please try again later",
                        "status", "error"
                ));
            }

            // 2. Handle existing user
            Optional<Personnel> existingUser = personnelRepository.findByMatricule(request.getMatricule());

            if (existingUser.isPresent()) {
                Personnel personnel = existingUser.get();

                // 2a. Email change attempt
                if (!personnel.getEmail().equalsIgnoreCase(request.getEmail())) {
                    session.setAttribute("registrationAttempts", sessionAttempts + 1);
                    return ResponseEntity.badRequest().body(Map.of(
                            "error", "Email cannot be changed for existing user",
                            "status", "error"
                    ));
                }

                // 2b. Account lock check
                if (personnel.isAccountLocked()) {
                    long remainingTime = LOCK_DURATION_MS - (System.currentTimeMillis() - personnel.getLockTime().getTime());
                    if (remainingTime > 0) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                                "error", "Account locked",
                                "message", "Account is locked. Please try again later.",
                                "remainingTime", remainingTime,
                                "status", "error"
                        ));
                    } else {
                        personnel.resetFailedAttempts();
                    }
                }

                // 2c. Increment attempts for existing user
                personnel.incrementFailedAttempts();
                if (personnel.getFailedLoginAttempts() >= MAX_REGISTRATION_ATTEMPTS) {
                    personnel.lockAccount("Too many registration attempts");
                    personnelRepository.save(personnel);
                    sendLockNotification(personnel);

                    session.setAttribute("registrationAttempts", sessionAttempts + 1);
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                            "error", "Account locked",
                            "message", "Account locked due to too many registration attempts",
                            "status", "error"
                    ));
                }

                personnelRepository.save(personnel);

                // 2d. Password update if changed
                if (!bCryptPasswordEncoder.matches(request.getPassword(), personnel.getMotDePasse())) {
                    personnel.setMotDePasse(bCryptPasswordEncoder.encode(request.getPassword()));
                    personnelRepository.save(personnel);
                    sendPasswordUpdateEmail(personnel);

                    // Send SSE update for password change
                    sseController.sendUpdate("password_changed", Map.of(
                            "matricule", personnel.getMatricule(),
                            "timestamp", new Date()
                    ));
                }

                return ResponseEntity.ok(Map.of(
                        "message", "Account information updated",
                        "action", "update",
                        "status", "success"
                ));
            }

            // 3. Handle new registration with invalid matricule
            if (!isValidMatricule(request.getMatricule())) {
                session.setAttribute("registrationAttempts", sessionAttempts + 1);
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Invalid matricule",
                        "message", "Matricule must be 5 digits",
                        "attemptsLeft", MAX_REGISTRATION_ATTEMPTS - (sessionAttempts + 1),
                        "status", "error"
                ));
            }

            // 4. Handle email conflict
            if (personnelRepository.existsByEmail(request.getEmail())) {
                session.setAttribute("registrationAttempts", sessionAttempts + 1);
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Email already in use",
                        "status", "error"
                ));
            }

            // 5. Successful new registration
            session.removeAttribute("registrationAttempts");

            Personnel newPersonnel = new Personnel();
            newPersonnel.setMatricule(request.getMatricule());
            newPersonnel.setEmail(request.getEmail());
            newPersonnel.setNom(request.getNom());
            newPersonnel.setPrenom(request.getPrenom());
            newPersonnel.setMotDePasse(bCryptPasswordEncoder.encode(request.getPassword()));
            newPersonnel.setActive(false);
            newPersonnel.setRole("Employee");

            personnelRepository.save(newPersonnel);

            // Send SSE update for new personnel
            sseController.sendUpdate("new_personnel", Map.of(
                    "id", newPersonnel.getId(),
                    "matricule", newPersonnel.getMatricule(),
                    "email", newPersonnel.getEmail(),
                    "active", newPersonnel.isActive(),
                    "timestamp", new Date()
            ));

            sendWelcomeEmail(newPersonnel);
            createSystemNotification(newPersonnel);

            return ResponseEntity.ok(Map.of(
                    "message", "Registration successful. Account pending activation.",
                    "action", "register",
                    "status", "success"
            ));

        } catch (Exception e) {
            logger.error("Registration failed", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", "Registration failed",
                    "message", e.getMessage(),
                    "status", "error"
            ));
        }
    }

    // Login endpoint
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpSession session) {
        try {
            if (request.getMatricule() == null || request.getMatricule().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Matricule is required"));
            }

            if (request.getPassword() == null || request.getPassword().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Password is required"));
            }

            Optional<Personnel> personnelOpt = personnelRepository.findByMatricule(request.getMatricule());
            if (personnelOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of(
                                "error", "Invalid credentials",
                                "message", "Invalid credentials",
                                "status", "error"
                        ));
            }

            Personnel personnel = personnelOpt.get();

            if (personnel.isAccountLocked()) {
                long lockTime = personnel.getLockTime() != null ? personnel.getLockTime().getTime() : 0;
                long remainingTime = 1800000 - (System.currentTimeMillis() - lockTime);

                if (remainingTime > 0) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(Map.of(
                                    "error", "Account locked",
                                    "message", "Account is locked. Please try again later."
                            ));
                } else {
                    personnel.resetFailedAttempts();
                    personnelRepository.save(personnel);
                }
            }

            Integer sessionAttempts = (Integer) session.getAttribute("loginAttempts");
            if (sessionAttempts == null) {
                sessionAttempts = 0;
            }

            if (!bCryptPasswordEncoder.matches(request.getPassword(), personnel.getMotDePasse())) {
                sessionAttempts++;
                session.setAttribute("loginAttempts", sessionAttempts);

                int attemptsLeft = 3 - sessionAttempts;

                if (sessionAttempts >= 3) {
                    personnel.setAccountLocked(true);
                    personnel.setLockTime(new Date());
                    personnel.setLockReason("Too many failed attempts in single session");
                    personnelRepository.save(personnel);

                    // Send SSE update for account lock
                    sseController.sendUpdate("account_locked", Map.of(
                            "matricule", personnel.getMatricule(),
                            "reason", "Too many failed login attempts",
                            "timestamp", new Date()
                    ));

                    String lockSubject = "Account Locked Notification";
                    String lockBody = String.format(
                            "<html><body>" +
                                    "<p>Dear %s %s,</p>" +
                                    "<p>Your account with matricule %s has been locked due to 3 failed login attempts.</p>" +
                                    "<p>Please contact HR department to unlock your account.</p>" +
                                    "<p>Regards,</p>" +
                                    "<p>HR Team</p>" +
                                    "</body></html>",
                            personnel.getPrenom(), personnel.getNom(),
                            personnel.getMatricule()
                    );

                    emailService.sendHtmlEmail(
                            personnel.getEmail(),
                            lockSubject,
                            lockBody
                    );

                    session.invalidate();

                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(Map.of(
                                    "error", "Account locked",
                                    "message", "Account locked due to too many failed attempts"
                            ));
                }

                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of(
                                "error", "Invalid credentials",
                                "message", "Invalid credentials",
                                "attemptsLeft", attemptsLeft,
                                "status", "error"
                        ));
            }

            session.removeAttribute("loginAttempts");
            if (personnel.isAccountLocked()) {
                personnel.resetFailedAttempts();
                personnelRepository.save(personnel);

                // Send SSE update for account unlock
                sseController.sendUpdate("account_unlocked", Map.of(
                        "matricule", personnel.getMatricule(),
                        "timestamp", new Date()
                ));
            }

            String token = jwtUtil.generateToken(personnel.getMatricule());

            Map<String, Object> userResponse = new HashMap<>();
            userResponse.put("matricule", personnel.getMatricule());
            userResponse.put("email", personnel.getEmail());
            userResponse.put("role", personnel.getRole());
            userResponse.put("prenom", personnel.getPrenom());
            userResponse.put("nom", personnel.getNom());
            userResponse.put("code_soc", personnel.getCode_soc()); // Changed to getCode_soc()
            userResponse.put("serviceName", personnel.getServiceName()); // Using the existing getServiceName() method
            userResponse.put("id", personnel.getId());
            userResponse.put("telephone", personnel.getTelephone());
            userResponse.put("sexe", personnel.getSexe());
            userResponse.put("situation", personnel.getSituation());
            userResponse.put("nbr_enfants", personnel.getNbr_enfants());
            userResponse.put("date_embauche", personnel.getDate_embauche());
            userResponse.put("cin", personnel.getCIN());
            userResponse.put("date_naiss", personnel.getDate_naiss());



            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "user", userResponse
            ));

        } catch (Exception e) {
            logger.error("Login error", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Login failed", "message", e.getMessage()));
        }
    }

    // Add personnel with matricule and email
    @PostMapping("/addWithMatriculeAndEmail")
    public ResponseEntity<?> addPersonnelWithMatriculeAndEmail(@RequestBody Map<String, String> payload) {
        try {
            Map<String, Object> response = new HashMap<>();
            String matricule = payload.get("matricule");
            String email = payload.get("email");
            String codeSoc = payload.get("code_soc");

            if (matricule == null || matricule.isEmpty()) {
                matricule = generateNewMatricule();
            } else if (!isValidMatricule(matricule)) {
                response.put("error", "Le matricule doit être composé de 5 chiffres (entre 00001 et 99999).");
                return ResponseEntity.badRequest().body(response);
            }

            if (email == null || email.isEmpty()) {
                response.put("error", "L'adresse e-mail est obligatoire.");
                return ResponseEntity.badRequest().body(response);
            }

            if (personnelRepository.findByEmail(email).isPresent()) {
                response.put("error", "L'adresse e-mail est déjà utilisée.");
                return ResponseEntity.badRequest().body(response);
            }

            if (personnelRepository.findByMatricule(matricule).isPresent()) {
                response.put("error", "Le matricule est déjà utilisé.");
                return ResponseEntity.badRequest().body(response);
            }

            if (codeSoc == null || codeSoc.isEmpty()) {
                response.put("error", "Le code société est obligatoire.");
                return ResponseEntity.badRequest().body(response);
            }

            Personnel newPersonnel = new Personnel();
            newPersonnel.setMatricule(matricule);
            newPersonnel.setEmail(email);
            newPersonnel.setCode_soc(codeSoc);
            newPersonnel.setActive(false);

            personnelRepository.save(newPersonnel);

            // Create notification
            notificationService.createNotification(
                    "Un nouveau Personnel ajouté avec le matricule : " + matricule,
                    "Admin",
                    null
            );

            // Send SSE update to all connected clients
            sseController.sendUpdate("new_personnel", Map.of(
                    "id", newPersonnel.getId(),
                    "matricule", matricule,
                    "email", email,
                    "active", false,
                    "timestamp", new Date()
            ));

            String token = jwtUtil.generateToken(email);

            String subject = "Votre compte a été créé";
            String body = "Bonjour,<br><br>" +
                    "Votre compte a été créé avec succès.<br>" +
                    "Voici vos informations de connexion :<br>" +
                    "Matricule : " + matricule + "<br>" +
                    "Email : " + email + "<br><br>" +
                    "Cordialement,<br>" +
                    "L'équipe de support.";

            response.put("message", "Personnel ajouté avec succès. En attente d'activation.");
            response.put("token", token);
            response.put("personnel", newPersonnel);

            try {
                emailService.sendHtmlEmail(email, subject, body);
                response.put("emailSent", true);
            } catch (Exception e) {
                logger.error("Failed to send email to {}", email, e);
                response.put("emailSent", false);
                response.put("emailError", "L'email n'a pas pu être envoyé.");
            }

            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            logger.error("Error in addPersonnelWithMatriculeAndEmail", ex);
            return ResponseEntity.internalServerError().body(Map.of("message", "Erreur lors de l'ajout du personnel : " + ex.getMessage()));
        }
    }

    // Get gender distribution statistics
    @GetMapping("/gender-distribution")
    public ResponseEntity<?> getGenderDistribution() {
        try {
            List<Personnel> personnelList = personnelRepository.findAll();
            int total = personnelList.size();

            if (total == 0) {
                return ResponseEntity.ok(Map.of("male", 0.0, "female", 0.0));
            }

            long maleCount = personnelList.stream()
                    .filter(p -> "male".equalsIgnoreCase(p.getSexe()))
                    .count();
            long femaleCount = personnelList.stream()
                    .filter(p -> "female".equalsIgnoreCase(p.getSexe()))
                    .count();

            Map<String, Double> genderDistribution = new HashMap<>();
            genderDistribution.put("male", (maleCount * 100.0) / total);
            genderDistribution.put("female", (femaleCount * 100.0) / total);

            return ResponseEntity.ok(genderDistribution);
        } catch (Exception e) {
            logger.error("Error in getGenderDistribution", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Error calculating gender distribution"));
        }
    }
    // Get role distribution statistics
    @Autowired
    private MongoTemplate mongoTemplate;

    @GetMapping("/role-distribution")
    public ResponseEntity<?> getRoleDistribution() {
        try {
            List<Personnel> personnelList = personnelRepository.findAll();
            List<Role> roles = roleRepository.findAll();

            // Create a map to count personnel per role
            Map<String, Long> roleCounts = new HashMap<>();

            // Initialize with "Unknown" role for null cases
            roleCounts.put("Non Activé", 0L);

            // Initialize all known roles with count 0
            roles.stream()
                    .filter(role -> role.getLibelle() != null) // Filter out null libelles
                    .forEach(role -> roleCounts.put(role.getLibelle(), 0L));

            // Count personnel per role
            for (Personnel personnel : personnelList) {
                String roleIdentifier = personnel.getRole();
                String roleName = "Non Activé"; // Default for null/unknown roles

                if (roleIdentifier != null) {
                    // Find matching role
                    roleName = roles.stream()
                            .filter(role -> roleIdentifier.equals(role.getId()))
                            .findFirst()
                            .map(Role::getLibelle)
                            .orElse(roleIdentifier); // Fallback to the identifier if role not found
                }

                // Ensure we don't put null keys in the map
                if (roleName == null) {
                    roleName = "Non Activé";
                }

                roleCounts.merge(roleName, 1L, Long::sum);
            }

            // Filter out null keys just in case
            Map<String, Long> filteredCounts = roleCounts.entrySet().stream()
                    .filter(entry -> entry.getKey() != null)
                    .collect(Collectors.toMap(
                            Map.Entry::getKey,
                            Map.Entry::getValue
                    ));

            return ResponseEntity.ok(filteredCounts);
        } catch (Exception e) {
            logger.error("Error in getRoleDistribution", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Error calculating role distribution"));
        }
    }

    // DTO for aggregation result
    @Data
    @AllArgsConstructor
    public static class RoleDistribution {
        private String role;
        private long count;
    }
    // Get activation status statistics
    @GetMapping("/activation-status")
    public ResponseEntity<?> getActivationStatus() {
        try {
            List<Personnel> personnelList = personnelRepository.findAll();

            long activatedCount = personnelList.stream()
                    .filter(Personnel::isActive)
                    .count();
            long nonActivatedCount = personnelList.size() - activatedCount;

            Map<String, Long> activationStatus = new HashMap<>();
            activationStatus.put("activated", activatedCount);
            activationStatus.put("nonActivated", nonActivatedCount);

            return ResponseEntity.ok(activationStatus);
        } catch (Exception e) {
            logger.error("Error in getActivationStatus", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Error calculating activation status"));
        }
    }

    // Get all personnel
    @GetMapping("/all")
    public ResponseEntity<?> getAllCollaborateurs() {
        try {
            List<Personnel> personnelList = personnelRepository.findAll();
            List<PersonnelDTO> result = personnelList.stream()
                    .map(this::convertToPersonnelDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Error in getAllCollaborateurs", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Erreur lors de la récupération des personnel."));
        }
    }

    // Update personnel information
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

            // Send SSE update for personnel modification
            sseController.sendUpdate("personnel_updated", Map.of(
                    "id", personnel.getId(),
                    "matricule", personnel.getMatricule(),
                    "changes", payload.keySet(),
                    "timestamp", new Date()
            ));

            return ResponseEntity.ok("Données mises à jour avec succès.");
        } catch (Exception ex) {
            logger.error("Error in updatePersonnel", ex);
            return ResponseEntity.internalServerError().body("Erreur lors de la mise à jour : " + ex.getMessage());
        }
    }

    // Request password reset
    @PostMapping("/request-password-reset")
    public ResponseEntity<?> requestPasswordReset(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            if (email == null || email.isEmpty()) {
                return ResponseEntity.badRequest().body("Email is required");
            }

            Optional<Personnel> personnelOpt = personnelRepository.findByEmail(email);
            if (personnelOpt.isEmpty()) {
                return ResponseEntity.ok("If an account exists with this email, a reset link has been sent");
            }

            Personnel personnel = personnelOpt.get();
            String resetToken = jwtUtil.generatePasswordResetToken(personnel.getEmail());

            String resetLink = "http://localhost:3000/reset-password?token=" + resetToken;
            String subject = "Réinitialisation de votre mot de passe";
            String body = "Bonjour " + personnel.getPrenom() + " " + personnel.getNom() + ",<br><br>" +
                    "Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous :<br>" +
                    "<a href=\"" + resetLink + "\">Réinitialiser le mot de passe</a><br><br>" +
                    "Ce lien expirera dans 24 heures.<br><br>" +
                    "Si vous n'avez pas fait cette demande, veuillez ignorer cet email.<br><br>" +
                    "Cordialement,<br>" +
                    "Votre équipe RH";

            emailService.sendHtmlEmail(email, subject, body);

            return ResponseEntity.ok("Si un compte existe avec cet email, un lien de réinitialisation a été envoyé");
        } catch (Exception ex) {
            logger.error("Error in requestPasswordReset", ex);
            return ResponseEntity.internalServerError().body("Erreur lors de la demande de réinitialisation");
        }
    }

    // Reset password
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            String token = request.getToken();
            String newPassword = request.getNewPassword();
            String confirmPassword = request.getConfirmPassword();

            if (token == null || token.isEmpty()) {
                return ResponseEntity.badRequest().body("Token de réinitialisation requis");
            }

            if (newPassword == null || newPassword.isEmpty()) {
                return ResponseEntity.badRequest().body("Nouveau mot de passe requis");
            }

            if (!newPassword.equals(confirmPassword)) {
                return ResponseEntity.badRequest().body("Les mots de passe ne correspondent pas");
            }

            String email;
            try {
                email = jwtUtil.extractUsername(token);
                if (!jwtUtil.validateToken(token, email) || !jwtUtil.isPasswordResetToken(token)) {
                    return ResponseEntity.badRequest().body("Token invalide ou expiré");
                }
            } catch (Exception e) {
                return ResponseEntity.badRequest().body("Token invalide ou expiré");
            }

            Optional<Personnel> personnelOpt = personnelRepository.findByEmail(email);
            if (personnelOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Token invalide");
            }

            Personnel personnel = personnelOpt.get();
            personnel.setMotDePasse(bCryptPasswordEncoder.encode(newPassword));
            personnelRepository.save(personnel);

            // Send SSE update for password reset
            sseController.sendUpdate("password_reset", Map.of(
                    "matricule", personnel.getMatricule(),
                    "timestamp", new Date()
            ));

            String subject = "Mot de passe mis à jour";
            String body = "Bonjour " + personnel.getPrenom() + ",<br><br>" +
                    "Votre mot de passe a été modifié avec succès.<br><br>" +
                    "Si vous n'avez pas effectué cette modification, veuillez contacter immédiatement le support.<br><br>" +
                    "Cordialement,<br>" +
                    "Votre équipe RH";

            emailService.sendHtmlEmail(email, subject, body);

            return ResponseEntity.ok("Mot de passe réinitialisé avec succès");
        } catch (Exception ex) {
            logger.error("Error in resetPassword", ex);
            return ResponseEntity.internalServerError().body("Erreur lors de la réinitialisation du mot de passe");
        }
    }

    // Validate reset token
    @PostMapping("/validate-reset-token")
    public ResponseEntity<?> validateResetToken(@RequestBody Map<String, String> request) {
        try {
            String token = request.get("token");
            if (token == null || token.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Token is required"));
            }

            if (!jwtUtil.validatePasswordResetToken(token)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired token"));
            }

            String email = jwtUtil.extractUsername(token);
            return ResponseEntity.ok(Map.of(
                    "message", "Token is valid",
                    "email", email
            ));
        } catch (Exception ex) {
            logger.error("Error in validateResetToken", ex);
            return ResponseEntity.internalServerError().body("Error validating token");
        }
    }

    // Update all fields for personnel
    @PutMapping("/updateAllFields/{id}")
    public ResponseEntity<?> updateAllFields(@PathVariable String id, @RequestBody Map<String, Object> updates) {
        try {
            Personnel personnel = personnelRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Personnel non trouvé avec l'ID : " + id));

            if (updates.containsKey("matricule")) {
                String matricule = updates.get("matricule").toString();
                if (!isValidMatricule(matricule)) {
                    return ResponseEntity.badRequest().body("Le matricule doit être composé de 5 chiffres (entre 00001 et 99999).");
                }
                personnel.setMatricule(matricule);
            }
            if (updates.containsKey("nom")) personnel.setNom(updates.get("nom").toString());
            if (updates.containsKey("prenom")) personnel.setPrenom(updates.get("prenom").toString());
            if (updates.containsKey("email")) personnel.setEmail(updates.get("email").toString());
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

            if (updates.containsKey("serviceId")) {
                String serviceId = updates.get("serviceId").toString();
                com.example.PortailRH.Model.Service service = serviceRepository.findById(serviceId)
                        .orElseThrow(() -> new RuntimeException("Service non trouvé avec l'ID : " + serviceId));
                personnel.setService(service);
            }

            personnelRepository.save(personnel);

            // Send SSE update for personnel modification
            sseController.sendUpdate("personnel_updated", Map.of(
                    "id", personnel.getId(),
                    "matricule", personnel.getMatricule(),
                    "changes", updates.keySet(),
                    "timestamp", new Date()
            ));

            return ResponseEntity.ok(Map.of("message", "Données du personnel mises à jour avec succès."));
        } catch (Exception ex) {
            logger.error("Error in updateAllFields", ex);
            return ResponseEntity.internalServerError().body(Map.of("message", "Erreur lors de la mise à jour : " + ex.getMessage()));
        }
    }

    // Get hierarchical chiefs with details
    @GetMapping("/matricules")
    public ResponseEntity<?> getChefHierarchiqueMatriculesWithDetails() {
        try {
            List<Personnel> chefHierarchiques = personnelRepository.findByRole("Chef Hiérarchique");

            List<Map<String, String>> result = chefHierarchiques.stream()
                    .map(personnel -> {
                        Map<String, String> entry = new HashMap<>();
                        entry.put("matricule", personnel.getMatricule());
                        entry.put("nom", personnel.getNom());
                        entry.put("prenom", personnel.getPrenom());
                        entry.put("role", personnel.getRole());
                        return entry;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Error in getChefHierarchiqueMatriculesWithDetails", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "message", "Erreur lors de la récupération des chefs hiérarchiques.",
                    "error", e.getMessage()
            ));
        }
    }

    // Get collaborators by service
    @GetMapping("/collaborateurs-by-service/{chefserviceid}")
    public ResponseEntity<?> getAllPersonnelByService(@PathVariable String chefserviceid) {
        try {
            Personnel chef = personnelRepository.findById(chefserviceid)
                    .orElseThrow(() -> new RuntimeException("Chef hiérarchique non trouvé"));

            if (!"Chef Hiérarchique".equals(chef.getRole())) {
                throw new RuntimeException("Le personnel spécifié n'est pas un chef hiérarchique");
            }

            com.example.PortailRH.Model.Service service = serviceRepository.findByChefHierarchiqueId(chefserviceid);
            if (service == null) {
                throw new RuntimeException("Aucun service trouvé pour ce chef hiérarchique");
            }

            List<Personnel> personnelList = personnelRepository.findByService(service);

            List<PersonnelDTO> collaborators = personnelList.stream()
                    .map(this::convertToPersonnelDTO)
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("serviceName", service.getServiceName());
            response.put("numberOfCollaborators", collaborators.size());
            response.put("collaborators", collaborators);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            logger.error("Validation error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            logger.error("System error: ", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Erreur système"));
        }
    }


    // Get personnel by ID
    @GetMapping("/byId/{id}")
    public ResponseEntity<?> getPersonnelById(@PathVariable String id) {
        try {
            Personnel personnel = personnelRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Personnel not found"));

            if (personnel.getService() == null && "Chef Hiérarchique".equals(personnel.getRole())) {
                com.example.PortailRH.Model.Service service = serviceRepository.findByChefHierarchiqueId(id);
                personnel.setService(service);
            }

            return ResponseEntity.ok(convertToPersonnelDTO(personnel));
        } catch (Exception e) {
            logger.error("Error in getPersonnelById", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Error retrieving personnel"));
        }
    }

    // Get all active personnel
    @GetMapping("/active")
    public ResponseEntity<?> getAllActivePersonnel() {
        try {
            List<Personnel> activePersonnelList = personnelRepository.findByActive(true);
            List<PersonnelDTO> result = activePersonnelList.stream()
                    .map(this::convertToPersonnelDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Error in getAllActivePersonnel", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Erreur lors de la récupération des personnels actifs."));
        }
    }

    // Get personnel by matricule
    @GetMapping("/matricule/{matricule}")
    public ResponseEntity<?> getPersonnelByMatricule(@PathVariable String matricule) {
        try {
            Personnel personnel = personnelRepository.findByMatricule(matricule)
                    .orElseThrow(() -> new RuntimeException("Personnel not found with matricule: " + matricule));

            Map<String, Object> response = new HashMap<>();
            response.put("id", personnel.getId());
            response.put("matricule", personnel.getMatricule());
            response.put("nom", personnel.getNom());
            response.put("prenom", personnel.getPrenom());
            response.put("role", personnel.getRole());
            response.put("active", personnel.isActive());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Error fetching personnel"));
        }
    }

    // Unlock account
    @PostMapping("/unlock-account")
    public ResponseEntity<?> unlockAccount(@RequestBody Map<String, String> request) {
        try {
            String matricule = request.get("matricule");
            if (matricule == null || matricule.isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("error", "Matricule is required")
                );
            }

            Optional<Personnel> personnelOpt = personnelRepository.findByMatricule(matricule);
            if (personnelOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                        Map.of("error", "User not found with matricule: " + matricule)
                );
            }

            Personnel personnel = personnelOpt.get();

            if (!personnel.isAccountLocked()) {
                return ResponseEntity.ok().body(
                        Map.of("message", "Account is not locked",
                                "matricule", matricule)
                );
            }

            // Unlock the account
            personnel.resetFailedAttempts();
            personnelRepository.save(personnel);

            // Send SSE update for account unlock
            sseController.sendUpdate("account_unlocked", Map.of(
                    "matricule", personnel.getMatricule(),
                    "timestamp", new Date()
            ));

            // Send unlock notification
            String unlockSubject = "Account Unlocked by Administrator";
            String unlockBody = String.format(
                    "Dear %s %s,\n\n" +
                            "Your account with matricule %s has been unlocked by an administrator.\n\n" +
                            "You may now login to the system.\n\n" +
                            "Regards,\n" +
                            "HR Team",
                    personnel.getPrenom(), personnel.getNom(),
                    personnel.getMatricule()
            );

            emailService.sendHtmlEmail(
                    personnel.getEmail(),
                    unlockSubject,
                    unlockBody
            );

            // Create system notification
            notificationService.createNotification(
                    "Account unlocked: " + personnel.getMatricule(),
                    "Admin",
                    personnel.getId()
            );

            return ResponseEntity.ok().body(
                    Map.of("message", "Account unlocked successfully",
                            "matricule", matricule,
                            "email", personnel.getEmail(),
                            "timestamp", new Date())
            );

        } catch (Exception e) {
            logger.error("Error unlocking account", e);
            return ResponseEntity.internalServerError().body(
                    Map.of("error", "Failed to unlock account: " + e.getMessage())
            );
        }
    }

    // Get all locked accounts
    @GetMapping("/locked-accounts")
    public ResponseEntity<?> getLockedAccounts() {
        try {
            List<Personnel> lockedAccounts = personnelRepository.findByAccountLocked(true);

            List<Map<String, Object>> response = lockedAccounts.stream()
                    .map(personnel -> {
                        Map<String, Object> accountInfo = new HashMap<>();
                        accountInfo.put("matricule", personnel.getMatricule());
                        accountInfo.put("fullName", personnel.getPrenom() + " " + personnel.getNom());
                        accountInfo.put("email", personnel.getEmail());
                        accountInfo.put("lockTime", personnel.getLockTime());
                        accountInfo.put("lockReason", personnel.getLockReason());
                        accountInfo.put("failedAttempts", personnel.getFailedLoginAttempts());

                        // Calculate remaining lock time if applicable
                        if (personnel.getLockTime() != null) {
                            long lockDuration = System.currentTimeMillis() - personnel.getLockTime().getTime();
                            long remainingTime = Math.max(0, 1800000 - lockDuration); // 30 minutes lock duration
                            accountInfo.put("remainingLockTime", remainingTime);
                            accountInfo.put("remainingLockTimeMinutes", TimeUnit.MILLISECONDS.toMinutes(remainingTime));
                        }

                        return accountInfo;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    Map.of("error", "Failed to retrieve locked accounts: " + e.getMessage())
            );
        }
    }

    // Helper methods
    private synchronized String generateNewMatricule() {
        Optional<Personnel> lastPersonnel = personnelRepository.findTopByOrderByMatriculeDesc();

        if (lastPersonnel.isPresent()) {
            String lastMatricule = lastPersonnel.get().getMatricule();
            try {
                int lastNumber = Integer.parseInt(lastMatricule);
                int newNumber = lastNumber + 1;

                // Handle rollover after 99999
                if (newNumber > 99999) {
                    newNumber = 1;
                }

                return String.format("%05d", newNumber);
            } catch (NumberFormatException e) {
                logger.error("Error parsing matricule: " + lastMatricule, e);
                return "00001";
            }
        }
        return "00001";
    }

    private boolean isValidMatricule(String matricule) {
        if (matricule == null || !matricule.matches("^\\d{5}$")) {
            return false;
        }
        try {
            int num = Integer.parseInt(matricule);
            return num >= 1 && num <= 99999;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private PersonnelDTO convertToPersonnelDTO(Personnel personnel) {
        PersonnelDTO dto = new PersonnelDTO();

        dto.setId(personnel.getId());
        dto.setMatricule(personnel.getMatricule());
        dto.setNom(personnel.getNom());
        dto.setPrenom(personnel.getPrenom());
        dto.setEmail(personnel.getEmail());
        dto.setRole(personnel.getRole());
        dto.setCode_soc(personnel.getCode_soc());
        dto.setDate_naiss(personnel.getDate_naiss());
        dto.setTelephone(personnel.getTelephone());
        dto.setCIN(personnel.getCIN());
        dto.setSexe(personnel.getSexe());
        dto.setSituation(personnel.getSituation());
        dto.setNbr_enfants(personnel.getNbr_enfants());
        dto.setDate_embauche(personnel.getDate_embauche());
        dto.setActive(personnel.isActive());

        if (personnel.getService() != null) {
            dto.setServiceId(personnel.getService().getId());
            dto.setServiceName(personnel.getService().getServiceName());
        } else {
            dto.setServiceId(null);
            dto.setServiceName("N/A");
        }

        if (personnel.getChefHierarchique() != null) {
            Personnel chef = personnel.getChefHierarchique();
            dto.setChefHierarchiqueId(chef.getId());
            dto.setChefHierarchiqueNom(chef.getNom());
            dto.setChefHierarchiquePrenom(chef.getPrenom());
            dto.setChefHierarchiqueMatricule(chef.getMatricule());
            dto.setChefHierarchiqueEmail(chef.getEmail());
        }

        return dto;
    }

    private void sendLockNotification(Personnel personnel) {
        String subject = "Account Locked Notification";
        String body = String.format(
                "<html><body>" +
                        "<p>Dear %s %s,</p>" +
                        "<p>Your account with matricule %s has been locked due to too many failed registration attempts.</p>" +
                        "<p>Please contact HR department to unlock your account.</p>" +
                        "<p>Regards,</p>" +
                        "<p>HR Team</p>" +
                        "</body></html>",
                personnel.getPrenom(), personnel.getNom(),
                personnel.getMatricule()
        );

        emailService.sendHtmlEmail(
                personnel.getEmail(),
                subject,
                body
        );
    }

    private void sendPasswordUpdateEmail(Personnel personnel) {
        String subject = "Password Updated Notification";
        String body = String.format(
                "<html><body>" +
                        "<p>Dear %s %s,</p>" +
                        "<p>Your password has been successfully updated for your account with matricule %s.</p>" +
                        "<p>If you didn't make this change, please contact HR immediately.</p>" +
                        "<p>Regards,</p>" +
                        "<p>HR Team</p>" +
                        "</body></html>",
                personnel.getPrenom(), personnel.getNom(),
                personnel.getMatricule()
        );

        emailService.sendHtmlEmail(
                personnel.getEmail(),
                subject,
                body
        );
    }

    private void sendWelcomeEmail(Personnel personnel) {
        String subject = "Welcome to Our System";
        String body = String.format(
                "<html><body>" +
                        "<p>Dear %s %s,</p>" +
                        "<p>Welcome to our system! Your account with matricule %s has been created successfully.</p>" +
                        "<p>Your account is pending activation by HR. You will receive another email once it's activated.</p>" +
                        "<p>Regards,</p>" +
                        "<p>HR Team</p>" +
                        "</body></html>",
                personnel.getPrenom(), personnel.getNom(),
                personnel.getMatricule()
        );

        emailService.sendHtmlEmail(
                personnel.getEmail(),
                subject,
                body
        );
    }
    @PostMapping("/change-password/{userId}")
    public ResponseEntity<?> changePasswordByUserId(
            @PathVariable String userId,
            @RequestBody Map<String, String> request) {

        try {
            // 1. Get the personnel by ID
            Optional<Personnel> personnelOpt = personnelRepository.findById(userId);
            if (personnelOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "User not found", "status", "error"));
            }

            Personnel personnel = personnelOpt.get();

            // 2. Validate request parameters
            String currentPassword = request.get("currentPassword");
            String newPassword = request.get("newPassword");
            String confirmPassword = request.get("confirmPassword");

            if (currentPassword == null || currentPassword.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Current password is required", "status", "error"));
            }

            if (newPassword == null || newPassword.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "New password is required", "status", "error"));
            }

            if (confirmPassword == null || confirmPassword.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Confirm password is required", "status", "error"));
            }

            // 3. Verify current password
            if (!bCryptPasswordEncoder.matches(currentPassword, personnel.getMotDePasse())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Current password is incorrect", "status", "error"));
            }

            // 4. Check if new password matches confirmation
            if (!newPassword.equals(confirmPassword)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "New password and confirmation don't match", "status", "error"));
            }

            // 5. Check if new password is different from current password
            if (bCryptPasswordEncoder.matches(newPassword, personnel.getMotDePasse())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "New password must be different from current password", "status", "error"));
            }

            // 6. Update password
            personnel.setMotDePasse(bCryptPasswordEncoder.encode(newPassword));
            personnelRepository.save(personnel);

            // 7. Send notification email
            String subject = "Password Changed Successfully";
            String body = String.format(
                    "<html><body>" +
                            "<p>Dear %s %s,</p>" +
                            "<p>Your password has been successfully changed.</p>" +
                            "<p>If you didn't make this change, please contact HR immediately.</p>" +
                            "<p>Regards,</p>" +
                            "<p>HR Team</p>" +
                            "</body></html>",
                    personnel.getPrenom(), personnel.getNom()
            );

            emailService.sendHtmlEmail(personnel.getEmail(), subject, body);

            // 8. Send SSE update
            sseController.sendUpdate("password_changed", Map.of(
                    "userId", personnel.getId(),
                    "matricule", personnel.getMatricule(),
                    "timestamp", new Date()
            ));

            return ResponseEntity.ok(Map.of(
                    "message", "Password changed successfully",
                    "status", "success"
            ));

        } catch (Exception e) {
            logger.error("Error changing password", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to change password", "message", e.getMessage(), "status", "error"));
        }
    }
    
    private void createSystemNotification(Personnel personnel) {
        notificationService.createNotification(
                "New personnel registered: " + personnel.getMatricule(),
                "System",
                personnel.getId()
        );
    }
}