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

    public void createNotification(String message) {
        Notification notification = new Notification();
        notification.setMessage(message);
        notification.setTimestamp(LocalDateTime.now());
        notification.setViewed(false);
        notificationRepository.save(notification);
    }

    public List<Notification> getUnviewedNotifications() {
        return notificationRepository.findByViewedFalse();
    }

    public void markAsViewed(String id) {
        Notification notification = notificationRepository.findById(id).orElse(null);
        if (notification != null) {
            notification.setViewed(true);
            notificationRepository.save(notification);
        }
    }
}
