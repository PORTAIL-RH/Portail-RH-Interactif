package com.example.PortailRH.Controller;

import com.example.PortailRH.Service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class WebSocketNotificationController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private NotificationService notificationService;

    // Handle WebSocket messages sent to "/app/send-notification"
    @MessageMapping("/send-notification")
    public void sendNotification(String message) {
        // Create and save the notification
        notificationService.createNotification(message);

        // Broadcast the notification to all subscribers
        messagingTemplate.convertAndSend("/topic/notifications", message);
    }
}