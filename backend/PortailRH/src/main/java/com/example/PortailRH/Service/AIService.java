package com.example.PortailRH.Service;

import com.example.PortailRH.Model.candidat;
import com.example.PortailRH.Repository.CandidatRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.mail.MessagingException;
import org.bson.types.ObjectId;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.*;
import java.util.Map;

@Service
public class AIService {

    private static final Logger logger = LoggerFactory.getLogger(AIService.class);

    private final CandidatRepository candidatRepository;
    private final EmailService emailService;

    public AIService(CandidatRepository candidatRepository, EmailService emailService) {
        this.candidatRepository = candidatRepository;
        this.emailService = emailService;
    }

    public Map<String, Object> processCV(String cvFilePath, String candidateId, String candidatureId) throws IOException {
        try {
            // Log the start of the process
            logger.info("Starting CV processing for candidate ID: {} and candidature ID: {}", candidateId, candidatureId);

            // Load the Python script from the classpath
            ClassPathResource resource = new ClassPathResource("ai_script.py");
            String pythonScriptPath = resource.getFile().getAbsolutePath();

            // Ensure that candidatureId is a valid ObjectId string
            if (!ObjectId.isValid(candidatureId)) {
                throw new IllegalArgumentException("Invalid Candidature ID: " + candidatureId);
            }

            // Escape the file path for the Python script
            String escapedCvFilePath = cvFilePath.replace("\\", "\\\\").replace("\"", "\\\"");

            // Construct the command to execute the Python script
            ProcessBuilder processBuilder = new ProcessBuilder("python", pythonScriptPath, escapedCvFilePath, candidateId, candidatureId);

            // Execute the Python script
            Process process = processBuilder.start();

            // Read the output from the Python script
            StringBuilder output = new StringBuilder();
            try (InputStream inputStream = process.getInputStream();
                 BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line);
                }
            }

            // Read the error output from the Python script
            StringBuilder errorOutput = new StringBuilder();
            try (InputStream errorStream = process.getErrorStream();
                 BufferedReader errorReader = new BufferedReader(new InputStreamReader(errorStream))) {
                String errorLine;
                while ((errorLine = errorReader.readLine()) != null) {
                    errorOutput.append(errorLine);
                }
            }

            // Wait for the script to complete
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                throw new IOException("Python script failed with exit code " + exitCode + ": " + errorOutput.toString());
            }

            // Log the error output (debug messages)
            if (errorOutput.length() > 0) {
                logger.warn("Python script debug output: {}", errorOutput.toString());
            }

            // Parse the JSON output from the Python script
            ObjectMapper objectMapper = new ObjectMapper();
            Map<String, Object> result = objectMapper.readValue(output.toString(), Map.class);

            // Log the result
            logger.info("CV processing result: {}", result);

            // Send email based on the score
            sendEmailBasedOnScore(result, candidateId);

            // Return the result
            return result;

        } catch (InterruptedException e) {
            logger.error("Error executing Python script: {}", e.getMessage(), e);
            throw new IOException("Error executing Python script: " + e.getMessage(), e);
        }
    }
    private void sendEmailBasedOnScore(Map<String, Object> result, String candidateId) {
        try {
            // Ensure the score is present and valid
            Double score = (Double) result.get("score");
            if (score == null) {
                throw new IllegalArgumentException("Score is missing in the AI result");
            }

            // Fetch the candidate from the database
            candidat candidat = candidatRepository.findById(candidateId)
                    .orElseThrow(() -> new IllegalArgumentException("Candidat non trouvé avec l'ID : " + candidateId));

            if (score > 0.0) {
                String subject = "Acceptation Première dans votre postulation à ArabSoft";
                String body = "Dear " + candidat.getNom() + ",\n\n" +
                        "Your postulation on " + candidat.getCandidatures().get(0).getDescription() + ".\n\n" +
                        "Has passed our first elimination. You will be contacted by our service for the interview.";
                emailService.sendVerificationEmail(candidat.getEmail(), subject, body);
            } else {
                String subject = "Réponse à votre postulation à ArabSoft";
                String body = "Dear " + candidat.getNom() + ",\n\n" +
                        "Your postulation on " + candidat.getCandidatures().get(0).getDescription() + ".\n\n" +
                        "Has not passed our first elimination. Thank you for your interest, and we wish you success in your future endeavors.";
                emailService.sendVerificationEmail(candidat.getEmail(), subject, body);
            }
        } catch (MessagingException e) {
            logger.error("Failed to send email to candidate: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to send email", e);
        }
    }}