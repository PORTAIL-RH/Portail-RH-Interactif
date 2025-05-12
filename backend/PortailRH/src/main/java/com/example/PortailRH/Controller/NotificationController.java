package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.Notification;
import com.example.PortailRH.Service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Créer une nouvelle notification pour un rôle spécifique
    @PostMapping
    public ResponseEntity<?> createNotification(@RequestBody Notification notification) {
        Notification savedNotification = notificationService.createNotification(notification.getMessage(), notification.getRole(), notification.getServiceId());
        return ResponseEntity.ok(savedNotification);
    }

    // Récupérer les notifications par rôle et serviceId (optionnel)
    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(
            @RequestParam String role,
            @RequestParam(required = false) String serviceId) { // serviceId est optionnel
        List<Notification> notifications;
        if (serviceId != null && !serviceId.isEmpty()) {
            // Filtrer par rôle et serviceId
            notifications = notificationService.getNotificationsByRoleAndServiceId(role, serviceId);
        } else {
            // Filtrer uniquement par rôle
            notifications = notificationService.getNotificationsByRole(role);
        }
        return ResponseEntity.ok(notifications);
    }

    // Récupérer uniquement les notifications non lues pour un rôle spécifique
    @GetMapping("/unread")
    public ResponseEntity<List<Notification>> getUnviewedNotifications(@RequestParam String role) {
        List<Notification> notifications = notificationService.getUnviewedNotificationsByRole(role);
        return ResponseEntity.ok(notifications);
    }

    // Marquer une notification comme vue
    @PostMapping("/{id}/view")
    public ResponseEntity<?> markAsViewed(@PathVariable String id) {
        notificationService.markAsViewed(id);
        return ResponseEntity.ok("Notification marked as viewed.");
    }

    // Récupérer le nombre total de notifications
    @GetMapping("/nbr")
    public ResponseEntity<Integer> getTotalNotificationsnb(@RequestParam String role) {
        List<Notification> notifications = notificationService.getAllNotificationsByRole(role); // Ensure this method exists in your service
        return ResponseEntity.ok(notifications.size());
    }

    // Récupérer le nombre de notifications non lues pour un rôle spécifique
    @GetMapping("/unreadnbr")
    public ResponseEntity<Integer> getUnviewedNotificationsnb(@RequestParam String role) {
        List<Notification> notifications = notificationService.getUnviewedNotificationsByRole(role);
        return ResponseEntity.ok(notifications.size());
    }

    // Mark all notifications as read for a specific role and serviceId
    // Expects a role and serviceId in a PUT request body, validates them, and calls the service method.
    @PutMapping("/mark-all-read")
    public ResponseEntity<?> markAllAsRead(@RequestBody Map<String, String> request) {
        String role = request.get("role");
        String serviceId = request.get("serviceId");

        if (role == null || role.isEmpty()) {
            return ResponseEntity.badRequest().body("Role is required");
        }

        // If role is not admin, serviceId is required
        if (!"Admin".equalsIgnoreCase(role)){
            if (serviceId == null || serviceId.isEmpty()) {
                return ResponseEntity.badRequest().body("ServiceId is required for non-admin roles");
            }
        }

        int updatedCount = notificationService.markAllAsRead(role, serviceId);
        return ResponseEntity.ok(Map.of(
                "message", "All notifications marked as read",
                "updatedCount", updatedCount
        ));
    }
}