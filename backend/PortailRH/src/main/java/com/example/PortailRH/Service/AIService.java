package com.example.PortailRH.Service;

import com.example.PortailRH.Model.Candidature;
import com.example.PortailRH.Model.candidat;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

@Service
public class AIService {
    private static final Logger logger = LoggerFactory.getLogger(AIService.class);

    @Value("${ai.script.path}")
    private String pythonScriptPath;

    @Value("${ai.script.timeout.seconds}")
    private long scriptTimeoutSeconds;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public void analyzeCvAgainstSkills(candidat candidate, Candidature jobPosting)
            throws IOException, InterruptedException, TimeoutException {

        logger.debug("Starting CV analysis for candidate {} against job {}",
                candidate.getId(), jobPosting.getId());

        // Validate inputs
        if (candidate == null || candidate.getCvFilePath() == null || candidate.getCvFilePath().isBlank()) {
            throw new IllegalArgumentException("Candidate CV path is required");
        }

        File cvFile = new File(candidate.getCvFilePath());
        if (!cvFile.exists()) {
            throw new FileNotFoundException("CV file not found: " + candidate.getCvFilePath());
        }

        File skillsFile = null;
        try {
            // Create temp skills file
            skillsFile = File.createTempFile("required_skills_", ".json");
            objectMapper.writeValue(skillsFile, jobPosting.getSkillsWithPercentage());
            logger.debug("Created temporary skills file: {}", skillsFile.getAbsolutePath());

            // Build and execute Python command
            ProcessBuilder pb = new ProcessBuilder(
                    "python",
                    pythonScriptPath,
                    cvFile.getAbsolutePath(),
                    skillsFile.getAbsolutePath()
            );
            pb.redirectErrorStream(true);

            logger.info("Executing AI script for candidate {} with job {}",
                    candidate.getId(), jobPosting.getId());

            Process process = pb.start();
            String output = readProcessOutput(process);
            logger.debug("Raw script output:\n{}", output);

            // Handle timeout
            if (!process.waitFor(scriptTimeoutSeconds, TimeUnit.SECONDS)) {
                process.destroyForcibly();
                throw new TimeoutException("Script execution timed out after " + scriptTimeoutSeconds + " seconds");
            }

            // Check exit code
            if (process.exitValue() != 0) {
                throw new RuntimeException("Script failed with exit code " + process.exitValue() + ". Output: " + output);
            }

            // Parse and validate response
            JsonNode result = objectMapper.readTree(output);
            logger.debug("Parsed JSON response: {}", result);

            if (!result.has("status")) {
                throw new IOException("Invalid script response - missing status field");
            }

            String status = result.path("status").asText();
            if (!"success".equals(status)) {
                String errorMsg = result.path("message").asText("Unknown error from script");
                throw new IOException("Script reported failure: " + errorMsg);
            }

            // Store raw response for debugging
            candidate.setAiResponse(output);

            // Update candidate with results
            updateCandidateFromResult(candidate, result);
            logger.info("Successfully processed CV analysis for candidate {}", candidate.getId());

        } finally {
            // Clean up temp file
            if (skillsFile != null && skillsFile.exists()) {
                if (!skillsFile.delete()) {
                    logger.warn("Failed to delete temporary skills file: {}", skillsFile.getAbsolutePath());
                }
            }
        }
    }

    private String readProcessOutput(Process process) throws IOException {
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line);
            }
            return output.toString();
        }
    }

    // In your AIService.java
    private void updateCandidateFromResult(candidat candidate, JsonNode result) {
        try {
            // Debug logging
            logger.debug("Raw AI response: {}", result);

            // Handle skills lists
            List<String> matched = new ArrayList<>();
            List<String> missing = new ArrayList<>();

            if (result.has("matched_skills")) {
                result.get("matched_skills").forEach(skill ->
                        matched.add(skill.asText()));
            }

            if (result.has("missing_skills")) {
                result.get("missing_skills").forEach(skill ->
                        missing.add(skill.asText()));
            }

            candidate.setMatchedSkills(matched);
            candidate.setMissingSkills(missing);

            // Handle score


        } catch (Exception e) {
            logger.error("Error processing AI response", e);
            candidate.setMatchedSkills(Collections.emptyList());
            candidate.setMissingSkills(Collections.emptyList());
        }
    }    public boolean verifyPythonEnvironment() {
        try {
            Process process = new ProcessBuilder("python", "--version").start();
            boolean success = process.waitFor(5, TimeUnit.SECONDS) && process.exitValue() == 0;
            if (!success) {
                logger.error("Python check failed with exit code {}", process.exitValue());
            }
            return success;
        } catch (Exception e) {
            logger.error("Python environment verification failed", e);
            return false;
        }
    }
}