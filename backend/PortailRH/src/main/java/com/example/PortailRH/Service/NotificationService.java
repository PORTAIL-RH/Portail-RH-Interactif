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
    private SimpMessagingTemplate messagingTemplate; // 🔥 Ajout du WebSocket

    // ✅ Créer une nouvelle notification + envoyer via WebSocket
    public Notification createNotification(String message) {
        Notification notification = new Notification();
        notification.setMessage(message);
        notification.setTimestamp(LocalDateTime.now());
        notification.setViewed(false); // Non lu par défaut

        Notification savedNotification = notificationRepository.save(notification);

        // 🔥 Envoi en temps réel via WebSocket
        messagingTemplate.convertAndSend("/topic/notifications", getUnviewedNotifications().size());

        return savedNotification;
    }

    // ✅ Récupérer toutes les notifications
    public List<Notification> getAllNotifications() {
        return notificationRepository.findAll();
    }

    // ✅ Récupérer uniquement les notifications non lues
    public List<Notification> getUnviewedNotifications() {
        return notificationRepository.findByViewedFalse();
    }

    // ✅ Marquer une notification comme "vue" et envoyer l'update WebSocket
    public boolean markAsViewed(String id) {
        Optional<Notification> optionalNotification = notificationRepository.findById(id);
        if (optionalNotification.isPresent()) {
            Notification notification = optionalNotification.get();
            notification.setViewed(true);
            notificationRepository.save(notification);

            // 🔥 Mise à jour en temps réel via WebSocket
            messagingTemplate.convertAndSend("/topic/notifications", getUnviewedNotifications().size());

            return true;
        }
        return false; // Notification inexistante
    }
}
