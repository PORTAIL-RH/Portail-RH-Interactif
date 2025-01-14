package com.example.PortailRH.Controller;

import com.example.PortailRH.Service.AdminUserService;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@RestController
@RequestMapping("/api/admin")
public class AdminUserController {

    private final AdminUserService adminUserService;  // Declare the service as a final field

    // Constructor injection
    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;  // Inject the dependency via constructor
    }

    /**
     * Activer un collaborateur avec des rôles
     */
    @PostMapping("/activate-personnel/{id}")
    public ResponseEntity<String> activateCollaborateur(
            @PathVariable String id,
            @RequestBody Set<String> roleNames) {  // Receives a set of role names

        try {
            // Activate the collaborateur and assign roles
            adminUserService.activateCollaborateur(id, roleNames);
            return ResponseEntity.ok("Collaborateur activé avec succès !");
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
        // Logic to verify the email (you can set the user as verified or perform other actions)
        return ResponseEntity.ok("Email vérifié avec succès !");
    }
}
