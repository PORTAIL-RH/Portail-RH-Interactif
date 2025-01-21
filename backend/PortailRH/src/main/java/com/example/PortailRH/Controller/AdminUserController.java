package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.Role;
import com.example.PortailRH.Service.AdminUserService;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminUserController {

    private final AdminUserService adminUserService;

    // Constructor injection
    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
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
}
