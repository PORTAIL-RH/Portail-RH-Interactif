package com.example.PortailRH.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.TimeUnit;

@Service
public class LlamaCVService {

    @Value("${llama.python.path:/usr/bin/python3}")
    private String pythonPath;

    @Value("${llama.script.path:src/main/python/cv_processor.py}")
    private String scriptPath;

    @Value("${llama.model.path:/models/llama-2-7b.Q4_K_M.gguf}")
    private String modelPath;

    private final ObjectMapper objectMapper;

    public LlamaCVService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public String processCV(String cvFilePath, String candidateId, String jobId) {
        try {
            // Validate inputs
            Path cvPath = Paths.get(cvFilePath);
            if (!cvPath.toFile().exists()) {
                throw new IllegalArgumentException("CV file not found");
            }

            // Build command
            String[] command = {
                    pythonPath,
                    scriptPath,
                    cvPath.toAbsolutePath().toString(),
                    candidateId,
                    jobId
            };

            // Execute process
            Process process = new ProcessBuilder(command)
                    .redirectErrorStream(true)
                    .start();

            // Handle timeout
            if (!process.waitFor(2, TimeUnit.MINUTES)) {
                process.destroy();
                throw new RuntimeException("Processing timeout");
            }

            // Read output
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {

                StringBuilder output = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line);
                }

                // Validate output
                if (process.exitValue() != 0) {
                    throw new RuntimeException("Processing failed: " + output);
                }

                return output.toString();
            }

        } catch (IOException | InterruptedException e) {
            throw new RuntimeException("CV processing error", e);
        }
    }

    public CVProcessingResult parseResult(String jsonResult) {
        try {
            return objectMapper.readValue(jsonResult, CVProcessingResult.class);
        } catch (IOException e) {
            throw new RuntimeException("Failed to parse processing result", e);
        }
    }

    public static class CVProcessingResult {
        private String status;
        private String candidateId;
        private String jobId;
        private Object cvData;
        private Object matchResult;
        private String error;
        private String timestamp;

        // Getters and setters
    }
}