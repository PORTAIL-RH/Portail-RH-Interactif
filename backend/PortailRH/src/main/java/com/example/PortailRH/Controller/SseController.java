package com.example.PortailRH.Controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;



@RestController
@RequestMapping("/sse")
public class SseController {

    private static final SseController INSTANCE = new SseController();
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    // Private constructor to prevent instantiation
    private SseController() {}

    // Public method to get the singleton instance
    public static SseController getInstance() {
        return INSTANCE;
    }

    // SSE endpoint for clients to subscribe to updates
    @GetMapping(value = "/updates", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribeToUpdates() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE); // No timeout
        emitters.add(emitter);

        // Remove the emitter when the client disconnects
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));

        return emitter;
    }

    // Helper method to send updates to all connected clients
    public void sendUpdate(String type, Object data) {
        for (SseEmitter emitter : emitters) {
            try {
                Map<String, Object> update = new HashMap<>();
                update.put("type", type);
                update.put("data", data);
                emitter.send(SseEmitter.event().data(update));
            } catch (IOException e) {
                emitters.remove(emitter);
            }
        }
    }
}