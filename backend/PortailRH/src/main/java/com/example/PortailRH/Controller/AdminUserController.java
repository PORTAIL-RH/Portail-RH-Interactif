package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.AdminUser;
import com.example.PortailRH.Model.Role;
import com.example.PortailRH.Repository.AdminUserRepository;
import com.example.PortailRH.Service.AdminUserService;
import com.example.PortailRH.Util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
public class AdminUserController {

    private final AdminUserService adminUserService;
    private final AdminUserRepository adminUserRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    // Constructor injection
    @Autowired
    public AdminUserController(AdminUserService adminUserService,
                               AdminUserRepository adminUserRepository,
                               BCryptPasswordEncoder passwordEncoder,
                               JwtUtil jwtUtil) {
        this.adminUserService = adminUserService;
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    /**
     * Activer un collaborateur avec des rôles
     */
    @PostMapping("/activate-personnel/{id}")
    public ResponseEntity<String> activateCollaborateur(
            @PathVariable String id,
            @RequestBody Role roleRequest) { // Accepting a RoleRequest object

        try {
            // Activate the collaborator with the given role
            adminUserService.activateCollaborateur(id, roleRequest.getLibelle());
            return ResponseEntity.ok("Collaborateur activé avec succès !");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Une erreur est survenue : " + e.getMessage());
        }
    }

    /**
     * Désactiver un collaborateur par son ID
     */
    @PostMapping("/desactivate-personnel/{id}")
    public ResponseEntity<String> desactivateCollaborateur(@PathVariable String id) {
        try {
            // Deactivate the collaborator
            adminUserService.desactivateCollaborateur(id);
            return ResponseEntity.ok("Collaborateur désactivé avec succès !");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Une erreur est survenue : " + e.getMessage());
        }
    }

    // Verification endpoint
    @GetMapping("/verify-email")
    public ResponseEntity<String> verifyEmail(@RequestParam String email) {
        return ResponseEntity.ok("Email vérifié avec succès !");
    }

    /**
     * Register a new Admin User
     */
    @PostMapping("/register")
    public ResponseEntity<String> registerAdminUser(@RequestBody AdminUser adminUser) {
        try {
            adminUserService.registerAdminUser(adminUser);
            return ResponseEntity.status(HttpStatus.CREATED).body("Admin user registered successfully!");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An error occurred: " + e.getMessage());
        }
    }

    /**
     * Login an Admin User
     */
    @PostMapping("/Login")
    public ResponseEntity<String> loginAdminUser(@RequestBody AdminUser adminUserRequest) {
        // Extract matricule and motDePasse from the request body
        String matricule = adminUserRequest.getMatricule();
        String motDePasse = adminUserRequest.getMotDePasse();

        // Validation des paramètres
        if (matricule == null || matricule.isEmpty() || motDePasse == null || motDePasse.isEmpty()) {
            return ResponseEntity.badRequest().body("Matricule and password must not be empty.");
        }

        try {
            // Fetch user by matricule
            Optional<AdminUser> optionalAdminUser = adminUserRepository.findByMatricule(matricule);

            if (optionalAdminUser.isPresent()) {
                AdminUser adminUser = optionalAdminUser.get();

                // Check if the password matches
                if (passwordEncoder.matches(motDePasse, adminUser.getMotDePasse())) {
                    // Generate JWT token
                    String token = jwtUtil.generateToken(matricule);  // Using matricule to generate the token

                    // Return the token in the response
                    return ResponseEntity.ok("Login successful! Token: " + token);
                } else {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials!");
                }
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found!");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An error occurred: " + e.getMessage());
        }
    }
}