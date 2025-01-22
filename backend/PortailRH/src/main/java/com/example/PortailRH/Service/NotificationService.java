package com.example.PortailRH.Service;

import com.example.PortailRH.Model.Notification;
import com.example.PortailRH.Repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    // Create a new notification
    public void createNotification(String message) {
        Notification notification = new Notification();
        notification.setMessage(message);
        notification.setTimestamp(LocalDateTime.now());
        notification.setViewed(false); // Initially set the notification as unviewed
        notificationRepository.save(notification);
    }

    // Fetch all notifications
    public List<Notification> getAllNotifications() {
        return notificationRepository.findAll();
    }

    // Fetch only unread (unviewed) notifications
    public List<Notification> getUnviewedNotifications() {
        return notificationRepository.findByViewedFalse(); // Use the custom query
    }

    // Mark a notification as viewed
    public boolean markAsViewed(String id) {
        Notification notification = notificationRepository.findById(id).orElse(null);
        if (notification != null) {
            notification.setViewed(true); // Set the notification as viewed
            notificationRepository.save(notification); // Save the updated notification
            return true;
        }
        return false; // Return false if the notification doesn't exist
    }
}
