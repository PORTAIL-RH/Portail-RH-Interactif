package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.Notification;
import com.example.PortailRH.Service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Create a new notification and broadcast it
    @PostMapping
    public ResponseEntity<?> createNotification(@RequestBody String message) {
        notificationService.createNotification(message);
        messagingTemplate.convertAndSend("/topic/notifications", message);
        return ResponseEntity.ok("Notification created and sent.");
    }

    // Fetch all notifications
    @GetMapping
    public ResponseEntity<List<Notification>> getAllNotifications() {
        List<Notification> notifications = notificationService.getAllNotifications();
        return ResponseEntity.ok(notifications);
    }

    // Fetch only unread (unviewed) notifications
    @GetMapping("/unread")
    public ResponseEntity<List<Notification>> getUnviewedNotifications() {
        List<Notification> notifications = notificationService.getUnviewedNotifications();
        return ResponseEntity.ok(notifications);
    }

    // Mark a notification as viewed
    @PostMapping("/{id}/view")
    public ResponseEntity<?> markAsViewed(@PathVariable String id) {
        notificationService.markAsViewed(id);
        return ResponseEntity.ok("Notification marked as viewed.");
    }

    // Fetch all notifications count
    @GetMapping("/nbr")
    public ResponseEntity<Integer> getTotalNotificationsnb() {
        List<Notification> notifications = notificationService.getAllNotifications();
        return ResponseEntity.ok(notifications.size());
    }

    // Fetch only unread (unviewed) notifications count
    @GetMapping("/unreadnbr")
    public ResponseEntity<Integer> getUnviewedNotificationsnb() {
        List<Notification> notifications = notificationService.getUnviewedNotifications();
        return ResponseEntity.ok(notifications.size());
    }
}