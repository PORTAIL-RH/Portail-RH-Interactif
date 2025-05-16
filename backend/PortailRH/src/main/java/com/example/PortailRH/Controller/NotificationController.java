package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.Notification;
import com.example.PortailRH.Repository.NotificationRepository;
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
    private NotificationRepository notificationRepository;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Créer une nouvelle notification pour un role,serviceId et codeSoc ou par personnelId
    @PostMapping
    public ResponseEntity<?> createNotification(@RequestBody Notification notification) {
        Notification savedNotification = notificationService.createNotification(notification.getMessage(), notification.getRole(), notification.getPersonnelId(),notification.getServiceId(),notification.getCodeSoc());
        return ResponseEntity.ok(savedNotification);
    }

    // Récupérer les notifications par role,serviceId et codeSoc ou par personnelId
    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(
            @RequestParam String role,
            @RequestParam(required = false) String personnelId,
            @RequestParam String serviceId,
            @RequestParam String codeSoc) { // personnelId est optionnel
        List<Notification> notifications;
        if ("Admin".equals(role)) {
            notifications = notificationService.getAllNotificationsByRole(role);
        } else if (personnelId != null && !personnelId.isEmpty()) {
            notifications = notificationService.getNotificationsByPersonnelId(personnelId);
        } else {
            notifications = notificationService.getNotificationsByRoleServiceIdCodeSoc(role, serviceId, codeSoc);
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

    // Récupérer le nombre total de notifications par role or service id
    @GetMapping("/nbr")
    public ResponseEntity<Integer> getTotalNotificationsnb(@RequestParam String role, @RequestParam(required = false) String personnelId) {
        List<Notification> notifications ;
        if ("Admin".equals(role)) {
            notifications = notificationService.getAllNotificationsByRole(role);
        } else if (personnelId != null && !personnelId.isEmpty()) {
            notifications = notificationService.getAllNotificationsByPersonnelId(personnelId);
        } else {
            // Return 0 or Bad Request depending on your logic
            return ResponseEntity.badRequest().body(0);
        }
        return ResponseEntity.ok(notifications.size());
    }

    // Récupérer le nombre de notifications non lues pour un personnelId spécifique
    @GetMapping("/unreadnbr")
    public ResponseEntity<Integer> getUnviewedNotificationsnb(@RequestParam String role, @RequestParam(required = false) String personnelId) {
        List<Notification> notifications;

        if ("Admin".equals(role)) {
            notifications = notificationService.getUnviewedNotificationsByRole(role);
        } else if (personnelId != null && !personnelId.isEmpty()) {
            notifications = notificationService.getUnviewedNotificationsByPersonnelId(personnelId);
        } else {
            // Return 0 or Bad Request depending on your logic
            return ResponseEntity.badRequest().body(0);
        }

        return ResponseEntity.ok(notifications.size());
    }


    // Récupérer le nombre de notifications non lues pour un rôle spécifique
   /* @GetMapping("/unreadnbr")
    public ResponseEntity<Integer> getUnviewedNotificationsnb(@RequestParam String role) {
        List<Notification> notifications = notificationService.getUnviewedNotificationsByRole(role);
        return ResponseEntity.ok(notifications.size());
    }*/

    // Mark all notifications as read for a specific role and personnelId
    // Expects a role and personnelId in a PUT request body, validates them, and calls the service method.
   @PutMapping("/mark-all-read")
    public ResponseEntity<?> markAllAsRead(@RequestBody Map<String, String> request) {
        String role = request.get("role");
        String personnelId = request.get("personnelId");

        if (role == null || role.isEmpty()) {
            return ResponseEntity.badRequest().body("Role is required");
        }

        // If role is not admin, personnelId is required
        if (!"Admin".equalsIgnoreCase(role)){
            if (personnelId == null || personnelId.isEmpty()) {
                return ResponseEntity.badRequest().body("personnelId is required for non-admin roles");
            }
        }

       int updatedCount = notificationService.markAllAsRead(role, personnelId);
        return ResponseEntity.ok(Map.of(
                "message", "All notifications marked as read",
                "updatedCount", updatedCount
        ));
    }

    // Récupérer les notifications non lues pour un utilisateur
    @GetMapping("/unread-for-user")
    public ResponseEntity<List<Notification>> getUnreadForUser(
            @RequestParam String personnelId,
            @RequestParam String role,
            @RequestParam String serviceId,
            @RequestParam String codeSoc) {

        List<Notification> notifications = notificationRepository.findUnreadForUser(
                personnelId, role, serviceId, codeSoc);
        return ResponseEntity.ok(notifications);
    }

    // Marquer une notification comme lue par un utilisateur
    @PostMapping("/{id}/mark-read-by")
    public ResponseEntity<?> markAsReadByUser(
            @PathVariable String id,
            @RequestParam String personnelId) {

        Notification notification = notificationService.findById(id);
        if (notification != null) {
            if (!notification.getReadBy().contains(personnelId)) {
                notification.getReadBy().add(personnelId);
                notificationService.save(notification);
            }
            return ResponseEntity.ok("Notification marked as read by user.");
        }
        return ResponseEntity.notFound().build();
    }

    // Récupérer le nombre de notifications non lues pour un utilisateur
    @GetMapping("/unread-count-for-user")
    public ResponseEntity<Integer> getUnreadCountForUser(
            @RequestParam String personnelId,
            @RequestParam String role,
            @RequestParam String serviceId,
            @RequestParam String codeSoc) {

        List<Notification> notifications = notificationRepository.findUnreadForUser(
                personnelId, role, serviceId, codeSoc);
        return ResponseEntity.ok(notifications.size());
    }
}