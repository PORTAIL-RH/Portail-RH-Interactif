package com.example.PortailRH.Service;

import com.example.PortailRH.Model.Notification;
import com.example.PortailRH.Repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Create a new notification with role and userId
    public Notification createNotification(String message, String role, String personnelId, String serviceId, String codeSoc) {
        Notification notification = new Notification();
        notification.setMessage(message);
        notification.setTimestamp(LocalDateTime.now());
        notification.setViewed(false);
        notification.setRole(role);
        notification.setCodeSoc(codeSoc); // ✅ Ajout du code_soc
        notification.setReadBy(new ArrayList<>()); // Critical addition

        // Cas admin
        if ("Admin".equalsIgnoreCase(role)) {
            // Admin notification (general broadcast)
            messagingTemplate.convertAndSend("/topic/notifications/Admin", notification);
        }
        // Cas RH ou Chef Hiérarchique : utiliser serviceId et code_soc
        else if ("RH".equalsIgnoreCase(role) || "Chef Hiérarchique".equalsIgnoreCase(role)) {
            // RH or Chef Hiérarchique notification (scoped by serviceId and codeSoc)
            if (serviceId != null && codeSoc != null) {
                notification.setServiceId(serviceId);
                messagingTemplate.convertAndSend("/topic/notifications/" + role + "/" + serviceId + "/" + codeSoc, notification);
            }
        }
        // Cas autres : notification générale
        else {
            // Default fallback: send to a generic personnel topic if nothing else matches
            if (personnelId != null) {
                notification.setPersonnelId(personnelId);
                messagingTemplate.convertAndSend("/topic/notifications/" + personnelId, notification);
            }
        }

        return notificationRepository.save(notification);
    }


    // Get all notification by role
    public List<Notification> getAllNotificationsByRole(String role) {
        return notificationRepository.findByRole(role);
    }
    public List<Notification> getAllNotificationsByPersonnelId(String PersonnelId) {
        return notificationRepository.findByPersonnelId(PersonnelId);
    }

    // Get unviewed notifications
    public List<Notification> getUnviewedNotifications() {
        return notificationRepository.findByViewedFalse();
    }

    // Get unviewed notifications for a specific role
    public List<Notification> getUnviewedNotificationsByRole(String role) {
        return notificationRepository.findByRoleAndViewedFalse(role);
    }

    // Get unviewed notifications for a specific personnelId
    public List<Notification> getUnviewedNotificationsByPersonnelId(String personnelId) {
        return notificationRepository.findByPersonnelIdAndViewedFalse(personnelId);
    }

    // Get all notifications for a specific personnelId
    public List<Notification> getNotificationsByPersonnelId(String personnelId) {
        return notificationRepository.findByPersonnelId(personnelId);
    }

    // Get unviewed notifications for a specific role and personnelId
    public List<Notification> getNotificationsByRoleAndPersonnelId(String role, String personnelId) {
        return notificationRepository.findByRoleAndPersonnelId(role, personnelId);
    }

    // Mark a notification as viewed
    public boolean markAsViewed(String id) {
        Optional<Notification> optionalNotification = notificationRepository.findById(id);
        if (optionalNotification.isPresent()) {
            Notification notification = optionalNotification.get();
            notification.setViewed(true);
            notificationRepository.save(notification);

            // Send real-time update via WebSocket
            messagingTemplate.convertAndSend("/topic/notifications/" + notification.getRole(), getUnviewedNotificationsByRole(notification.getRole()).size());

            return true;
        }
        return false; // Notification not found
    }

    // Marks all fetched notifications as viewed and saves them.
    public int markAllAsRead(String role, String personnelId) {
        List<Notification> unreadNotifications;

        if ("Admin".equalsIgnoreCase(role)) {
            // Admin doesn't need a serviceId
            unreadNotifications = notificationRepository.findByRoleAndViewedFalse(role);
        } else {
            // For non-admin, personnelId is required
            unreadNotifications = notificationRepository.findByPersonnelIdAndViewedFalse(personnelId);
        }

        unreadNotifications.forEach(notification -> {
            notification.setViewed(true);
            notificationRepository.save(notification);
        });

        return unreadNotifications.size();
    }
    // Get notifications by role
    public List<Notification> getNotificationsByRoleServiceIdCodeSoc(String role, String serviceId, String codeSoc) {
        return notificationRepository.findByRoleAndServiceIdAndCodeSoc(role, serviceId, codeSoc);
    }
//for new groupe notification
    public Notification findById(String id) {
        return notificationRepository.findById(id).orElse(null);
    }

    public Notification save(Notification notification) {
        return notificationRepository.save(notification);
    }

}