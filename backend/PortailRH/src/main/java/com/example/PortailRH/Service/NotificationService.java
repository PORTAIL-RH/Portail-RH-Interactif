package com.example.PortailRH.Service;

import com.example.PortailRH.Model.Notification;
import com.example.PortailRH.Repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Create a new notification with role and userId
    public Notification createNotification(String message, String role, String personnelId) {
        Notification notification = new Notification();
        notification.setMessage(message);
        notification.setTimestamp(LocalDateTime.now());
        notification.setViewed(false);
        notification.setRole(role);

        // Associer la notification à un personnel spécifique si l'ID est fourni
        if (personnelId != null && !personnelId.isEmpty()) {
            notification.setPersonnelId(personnelId);
        } else {
            notification.setPersonnelId(null); // Facultatif : nettoyer si besoin
        }

        Notification savedNotification = notificationRepository.save(notification);

        // Envoyer la notification en temps réel via WebSocket
        messagingTemplate.convertAndSend("/topic/notifications/" + role + "/" + personnelId, savedNotification);

        return savedNotification;
    }


    // Get all notification by role
    public List<Notification> getAllNotificationsByRole(String role) {
        return notificationRepository.findByRole(role); // Assuming you have a repository method to filter by role
    }

    // Get unviewed notifications
    public List<Notification> getUnviewedNotifications() {
        return notificationRepository.findByViewedFalse();
    }

    // Get unviewed notifications for a specific role
    public List<Notification> getUnviewedNotificationsByRole(String role) {
        return notificationRepository.findByRoleAndViewedFalse(role);
    }

    // Get unviewed notifications for a specific role
    public List<Notification> getUnviewedNotificationsByPersonnelId(String personnelId) {
        return notificationRepository.findByPersonnelIdAndViewedFalse(personnelId);
    }

    // Get unviewed notifications for a specific role and personnelId
    public List<Notification> getNotificationsByRoleAndPersonnelId(String role, String personnelId) {
        return notificationRepository.findByRoleAndPersonnelIdAndViewedFalse(role, personnelId);
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

    // Get notifications by role
    public List<Notification> getNotificationsByRole(String role) {
        return notificationRepository.findByRole(role);
    }



    // Marks all fetched notifications as viewed and saves them.
    public int markAllAsRead(String role, String personnelId) {
        List<Notification> unreadNotifications;

        if ("Admin".equalsIgnoreCase(role)) {
            // Admin doesn't need a personnelId
            unreadNotifications = notificationRepository.findByRoleAndViewedFalse(role);
        } else {
            // For non-admin, personnelId is required
            unreadNotifications = notificationRepository.findByRoleAndPersonnelIdAndViewedFalse(role, personnelId);
        }

        unreadNotifications.forEach(notification -> {
            notification.setViewed(true);
            notificationRepository.save(notification);
        });

        return unreadNotifications.size();
    }

}