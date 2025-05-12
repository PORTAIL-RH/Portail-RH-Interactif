package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.AdminUser;
import com.example.PortailRH.Repository.ServiceRepository;
import com.example.PortailRH.Service.AdminUserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")

public class AdminUserController {

    @Autowired
    private AdminUserService adminUserService;
    private ServiceRepository serviceRepository;

    private static final Logger log = LoggerFactory.getLogger(AdminUserController.class);


    /**
     * Activate a collaborator by assigning a role and service.
     */
    @PostMapping("/activate-personnel/{id}")
    public ResponseEntity<?> activateCollaborateur(
            @PathVariable String id,
            @RequestBody Map<String, String> payload,
            HttpServletRequest request) {

        // Verify authentication
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Authentication required"));
        }

        log.info("Activation request for personnel ID: {} by user: {}", id, authentication.getName());

        try {
            String role = payload.get("role");
            String serviceId = payload.get("serviceId");

            if (role == null || role.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Role is required"));
            }

            // Validate that service is provided for roles that require it
            if (Arrays.asList("collaborateur", "Chef Hiérarchique", "RH").contains(role)) {
                if (serviceId == null || serviceId.isEmpty()) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("message", "Service is required for " + role + " role"));
                }
            }

            adminUserService.activateCollaborateur(id, role, serviceId);

            return ResponseEntity.ok()
                    .body(Map.of("message", "Personnel activated successfully"));

        } catch (IllegalArgumentException e) {
            log.error("Validation error: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("Server error: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "An error occurred while processing your request"));
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