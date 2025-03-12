package com.example.PortailRH.Controller;

import com.example.PortailRH.Service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class WebSocketNotificationController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private NotificationService notificationService;

    // Send a notification to all connected clients
    @MessageMapping("/send-notification")
    public void sendNotification(String message, @Header("role") String role, @Header("serviceId") String serviceId) {
        // Create a notification with role and serviceId
        notificationService.createNotification(message, role, serviceId);

        // Broadcast the notification to all subscribers
        messagingTemplate.convertAndSend("/topic/notifications", message);
    }
}