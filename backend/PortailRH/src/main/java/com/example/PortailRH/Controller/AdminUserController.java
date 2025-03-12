package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.AdminUser;
import com.example.PortailRH.Repository.ServiceRepository;
import com.example.PortailRH.Service.AdminUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminUserController {

    @Autowired
    private AdminUserService adminUserService;
    private ServiceRepository serviceRepository;



    /**
     * Activate a collaborator by assigning a role and service.
     */
    @PostMapping("/activate-personnel/{id}")
    public ResponseEntity<?> activateCollaborateur(
            @PathVariable String id,
            @RequestBody Map<String, String> payload) {

        try {
            String role = payload.get("role");
            String serviceId = payload.get("serviceId");

            // Validate role
            if (role == null || role.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Role is required."));
            }

            // Validate serviceId for "collaborateur" and "Chef Hiérarchique" roles
            if ((role.equals("collaborateur") || role.equals("Chef Hiérarchique"))) {
                if (serviceId == null || serviceId.isEmpty()) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("message", "Service ID is required for '" + role + "' role."));
                }
            } else {
                // For other roles, set serviceId to null
                serviceId = null;
            }

            // Call the service method
            adminUserService.activateCollaborateur(id, role, serviceId);

            return ResponseEntity.ok(Map.of("message", "Personnel activé avec succès !"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Une erreur est survenue : " + e.getMessage()));
        }
    }

    /**
     * Deactivate a collaborator by ID.
     */
    @PostMapping("/desactivate-personnel/{id}")
    public ResponseEntity<Map<String, String>> desactivateCollaborateur(@PathVariable String id) {
        try {
            adminUserService.desactivateCollaborateur(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Personnel désactivé avec succès !");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", "Une erreur est survenue : " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Register a new Admin User.
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
}