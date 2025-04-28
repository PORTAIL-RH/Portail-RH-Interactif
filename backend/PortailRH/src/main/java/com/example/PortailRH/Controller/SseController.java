package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.Personnel;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/sse")
@CrossOrigin(origins = "*")
public class SseController {

    private final Map<String, SseEmitter> userEmitters = new ConcurrentHashMap<>();
    private static final long SSE_TIMEOUT = 30 * 60 * 1000; // 30 minutes timeout
    private static final long HEARTBEAT_INTERVAL = 25; // Seconds (less than timeout)

    @GetMapping(value = "/updates", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamUpdates(@RequestParam String userId) {
        // Create new emitter with timeout
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);

        // Store emitter with user ID
        userEmitters.put(userId, emitter);

        // Setup heartbeat
        ScheduledExecutorService heartbeatScheduler = Executors.newSingleThreadScheduledExecutor();
        heartbeatScheduler.scheduleAtFixedRate(() -> {
            try {
                emitter.send(SseEmitter.event()
                        .comment("heartbeat")
                        .reconnectTime(5000));
            } catch (Exception e) {
                heartbeatScheduler.shutdown();
                userEmitters.remove(userId);
            }
        }, 0, HEARTBEAT_INTERVAL, TimeUnit.SECONDS);

        // Setup completion and timeout handlers
        emitter.onCompletion(() -> {
            heartbeatScheduler.shutdown();
            userEmitters.remove(userId);
        });

        emitter.onTimeout(() -> {
            heartbeatScheduler.shutdown();
            userEmitters.remove(userId);
            emitter.complete();
        });

        // Send initial connection event
        try {
            emitter.send(SseEmitter.event()
                    .name("connection")
                    .data(Map.of("status", "connected", "timestamp", System.currentTimeMillis()))
                    .reconnectTime(5000));
        } catch (IOException e) {
            emitter.completeWithError(e);
        }

        return emitter;
    }

    // Add this method to fix the compilation error
    public void sendUpdate(String userId, Object data) {
        sendUserUpdate(userId, "update", data);
    }

    public void sendUserUpdate(String userId, String eventType, Object data) {
        SseEmitter emitter = userEmitters.get(userId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event()
                        .name(eventType)
                        .data(data)
                        .reconnectTime(5000));
            } catch (Exception e) {
                userEmitters.remove(userId);
                emitter.complete();
            }
        }
    }

    public void broadcastUpdate(String eventType, Object data) {
        userEmitters.forEach((userId, emitter) -> {
            try {
                emitter.send(SseEmitter.event()
                        .name(eventType)
                        .data(data)
                        .reconnectTime(5000));
            } catch (Exception e) {
                userEmitters.remove(userId);
                emitter.complete();
            }
        });
    }

    // In SseController.java
    public void sendPersonnelUpdate(String userId, Personnel personnel, String updateType) {
        sendUserUpdate(userId, "personnel_update", Map.of(
                "type", updateType,
                "data", convertToPersonnelDTO(personnel),
                "timestamp", System.currentTimeMillis()
        ));
    }

    public void sendPersonnelActivation(String userId, String matricule, boolean active) {
        sendUserUpdate(userId, "personnel_activation", Map.of(
                "type", "personnel_activation",
                "matricule", matricule,
                "active", active,
                "timestamp", System.currentTimeMillis()
        ));
    }

    public void sendAccountStatusUpdate(String userId, String matricule, String status, String reason) {
        sendUserUpdate(userId, "account_status", Map.of(
                "type", "account_status",
                "matricule", matricule,
                "status", status,
                "reason", reason,
                "timestamp", System.currentTimeMillis()
        ));
    }

    private Map<String, Object> convertToPersonnelDTO(Personnel personnel) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", personnel.getId());
        dto.put("matricule", personnel.getMatricule());
        dto.put("nom", personnel.getNom());
        dto.put("prenom", personnel.getPrenom());
        dto.put("email", personnel.getEmail());
        dto.put("role", personnel.getRole());
        dto.put("active", personnel.isActive());
        dto.put("sexe", personnel.getSexe());
        dto.put("dateNaissance", personnel.getDate_naiss());
        dto.put("telephone", personnel.getTelephone());
        dto.put("cin", personnel.getCIN());
        dto.put("situation", personnel.getSituation());
        dto.put("nbrEnfants", personnel.getNbr_enfants());
        return dto;
    }
}