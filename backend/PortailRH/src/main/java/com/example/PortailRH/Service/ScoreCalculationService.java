package com.example.PortailRH.Service;

import com.example.PortailRH.Model.Candidature;
import com.example.PortailRH.Model.candidat;
import com.fasterxml.jackson.core.type.TypeReference; // Make sure this import is present
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ScoreCalculationService {
    private static final Logger logger = LoggerFactory.getLogger(ScoreCalculationService.class);
    private static final double QUALIFIED_THRESHOLD = 65.0; // Example threshold for acceptance
    private final ObjectMapper objectMapper = new ObjectMapper();

    // TypeReference for robust List<String> deserialization from AI response
    private static final TypeReference<List<String>> LIST_OF_STRINGS_TYPE_REF = new TypeReference<List<String>>() {};

    public void calculateScore(candidat candidate, Candidature jobPosting) {
        logger.debug("Starting score calculation for candidate {}", candidate.getId());

        try {
            if (candidate == null) {
                logger.error("Cannot calculate score: Candidate object is null.");
                return;
            }

            // Initialize candidate fields to default values
            initializeCandidateDefaults(candidate);

            // Process AI response to populate matchedSkills list
            // This method should ensure candidate.matchedSkills is a List<String>
            if (candidate.getAiResponse() != null && !candidate.getAiResponse().isEmpty()) {
                processAiResponseAndUpdateCandidateSkills(candidate);
            } else {
                logger.warn("No AI response available for candidate {}. Matched skills will be empty.", candidate.getId());
                // MatchedSkills is already initialized to empty by initializeCandidateDefaults
            }

            // If job posting or its skills are missing, we cannot calculate a weighted score.
            // In this scenario, we'll rely purely on the direct AI match_score (if it was parsed)
            // or default to 0 if no AI score was available.
            if (jobPosting == null || jobPosting.getSkillsWithPercentage() == null || jobPosting.getSkillsWithPercentage().isEmpty()) {
                logger.warn("Job posting details or required skills are missing for candidate {}. " +
                        "Final score will be based on direct AI match_score or default to 0.", candidate.getId());
                // Use the AI's direct match_score if available (already set in candidate by processAiResponse)
                // or the default from initializeCandidateDefaults if AI response was missing/bad
                setScoresBasedOnDirectAiMatch(candidate);
                return;
            }

            // --- Calculate Weighted Score based on Job Posting Requirements ---
            logger.debug("Calculating weighted score for candidate {} against job posting {}",
                    candidate.getId(), jobPosting.getId());

            // Normalize required skill names (lowercase, trimmed) from job posting
            Map<String, Integer> requiredSkillsMap = jobPosting.getSkillsWithPercentage().entrySet().stream()
                    .filter(entry -> entry.getKey() != null && entry.getValue() != null)
                    .collect(Collectors.toMap(
                            entry -> entry.getKey().toLowerCase().trim(),
                            Map.Entry::getValue,
                            (existingValue, newValue) -> existingValue // Keep first on duplicate keys
                    ));
            Set<String> requiredSkillsLowercase = requiredSkillsMap.keySet();

            // Candidate's matched skills should already be List<String> after processAiResponse
            List<String> validMatchedSkills = candidate.getMatchedSkills().stream()
                    .filter(Objects::nonNull)
                    .map(String::toLowerCase)
                    .map(String::trim)
                    .filter(requiredSkillsLowercase::contains) // Only consider skills required by *this* job
                    .distinct()
                    .collect(Collectors.toList());

            logger.debug("Candidate {} - Relevant matched skills for job {}: {}",
                    candidate.getId(), jobPosting.getId(), validMatchedSkills);

            // Calculate total possible weight from the job posting's requirements
            double totalPossibleWeight = requiredSkillsMap.values().stream()
                    .mapToInt(Integer::intValue)
                    .sum();

            if (totalPossibleWeight <= 0) {
                logger.warn("Total possible weight for skills in job posting {} is zero or negative. " +
                        "Scores will be set to 0.", jobPosting.getId());
                candidate.setMatchPercentage(0.0);
                candidate.setScore(0.0);
                candidate.setAccepted(false);
                return;
            }

            // Calculate the sum of weights for the skills the candidate *actually matched* for this job
            double matchedWeight = validMatchedSkills.stream()
                    .mapToDouble(skill -> requiredSkillsMap.getOrDefault(skill, 0)) // Get weight for each valid skill
                    .sum();

            // Calculate final match percentage (0-100) based *solely* on weighted skills
            double weightedMatchPercentage = (matchedWeight / totalPossibleWeight) * 100.0;

            // Set final scores based on this weighted percentage
            candidate.setMatchPercentage(roundToOneDecimal(weightedMatchPercentage));
            candidate.setScore(roundToOneDecimal((weightedMatchPercentage / 100.0) * 10.0)); // Scale 0-100% to 0-10
            candidate.setAccepted(weightedMatchPercentage >= QUALIFIED_THRESHOLD);

            logger.info("Final weighted scores for candidate {}: Weighted Match={}%, Final Score={}, Accepted={}",
                    candidate.getId(),
                    candidate.getMatchPercentage(),
                    candidate.getScore(),
                    candidate.getAccepted());

        } catch (Exception e) {
            logger.error("Error during score calculation for candidate {}: {}",
                    (candidate != null ? candidate.getId() : "null"), e.getMessage(), e);
            // Fallback to default/AI scores in case of any unexpected error during calculation
            if (candidate != null) {
                setScoresBasedOnDirectAiMatch(candidate);
            }
        }
    }

    private void initializeCandidateDefaults(candidat candidate) {
        if (candidate.getMatchPercentage() == null) candidate.setMatchPercentage(0.0);
        if (candidate.getScore() == null) candidate.setScore(0.0);
        if (candidate.getAccepted() == null) candidate.setAccepted(false);
        if (candidate.getMatchScore() == null) candidate.setMatchScore(0.0); // Direct AI score
        if (candidate.getMatchedSkills() == null) candidate.setMatchedSkills(new ArrayList<>());
        if (candidate.getMissingSkills() == null) candidate.setMissingSkills(new ArrayList<>());
        // Strengths/Weaknesses are usually set by AIService or processAiResponse
    }

    // Parses the raw AI JSON response string and updates the candidate's skill lists and direct AI score
    private void processAiResponseAndUpdateCandidateSkills(candidat candidate) {
        List<String> matchedSkills = new ArrayList<>();
        List<String> missingSkills = new ArrayList<>();
        double aiDirectMatchScore = 0.0; // Default for AI's direct score

        try {
            JsonNode aiResponseNode = objectMapper.readTree(candidate.getAiResponse());
            logger.debug("Processing AI response for candidate {}: {}", candidate.getId(), aiResponseNode.toString());

            // Extract AI's direct match_score percentage
            if (aiResponseNode.hasNonNull("match_score")) {
                aiDirectMatchScore = aiResponseNode.get("match_score").asDouble(0.0);
            } else {
                logger.warn("AI response for candidate {} missing 'match_score'. Defaulting direct AI score to 0.0.", candidate.getId());
            }

            // Extract matched_skills as List<String>
            if (aiResponseNode.hasNonNull("matched_skills") && aiResponseNode.get("matched_skills").isArray()) {
                try {
                    matchedSkills = objectMapper.convertValue(aiResponseNode.get("matched_skills"), LIST_OF_STRINGS_TYPE_REF);
                    if (matchedSkills == null) matchedSkills = new ArrayList<>(); // Handle null from convertValue
                    logger.debug("Extracted AI matched_skills ({} items): {}", matchedSkills.size(), matchedSkills);
                } catch (IllegalArgumentException e) {
                    logger.error("Failed to convert 'matched_skills' JSON array to List<String> for candidate {}. JSON: {}. Error: {}",
                            candidate.getId(), aiResponseNode.get("matched_skills").toString(), e.getMessage());
                    // Keep matchedSkills as empty list
                }
            } else {
                logger.warn("AI response for candidate {} missing or invalid 'matched_skills' array.", candidate.getId());
            }

            // Extract missing_skills as List<String>
            if (aiResponseNode.hasNonNull("missing_skills") && aiResponseNode.get("missing_skills").isArray()) {
                try {
                    missingSkills = objectMapper.convertValue(aiResponseNode.get("missing_skills"), LIST_OF_STRINGS_TYPE_REF);
                    if (missingSkills == null) missingSkills = new ArrayList<>(); // Handle null
                    logger.debug("Extracted AI missing_skills ({} items): {}", missingSkills.size(), missingSkills);
                } catch (IllegalArgumentException e) {
                    logger.error("Failed to convert 'missing_skills' JSON array to List<String> for candidate {}. JSON: {}. Error: {}",
                            candidate.getId(), aiResponseNode.get("missing_skills").toString(), e.getMessage());
                    // Keep missingSkills as empty list
                }
            } else {
                logger.warn("AI response for candidate {} missing or invalid 'missing_skills' array.", candidate.getId());
            }

            // Optional: Also extract strengths and weaknesses from the AI response
            if (aiResponseNode.hasNonNull("strengths")) {
                candidate.setStrengths(aiResponseNode.get("strengths").asText(""));
            }
            if (aiResponseNode.hasNonNull("weaknesses")) {
                candidate.setWeaknesses(aiResponseNode.get("weaknesses").asText(""));
            }

        } catch (Exception e) {
            logger.error("Failed to parse AI response JSON for candidate {}: {}. Raw response: {}",
                    candidate.getId(), e.getMessage(), candidate.getAiResponse());
            // In case of parsing failure, ensure defaults are set for skills lists and AI score
            aiDirectMatchScore = 0.0;
            matchedSkills = new ArrayList<>();
            missingSkills = new ArrayList<>();
        } finally {
            // Update candidate object with extracted data
            candidate.setMatchScore(aiDirectMatchScore); // Store the AI's direct percentage score
            candidate.setMatchedSkills(matchedSkills.stream().distinct().collect(Collectors.toList())); // Ensure distinct
            candidate.setMissingSkills(missingSkills.stream().distinct().collect(Collectors.toList())); // Ensure distinct
        }
    }

    // Sets final scores based purely on the direct AI match_score
    // Used when weighted calculation isn't possible (e.g., no job skills)
    private void setScoresBasedOnDirectAiMatch(candidat candidate) {
        double directAiScorePercent = candidate.getMatchScore() != null ? candidate.getMatchScore() : 0.0;
        candidate.setMatchPercentage(roundToOneDecimal(directAiScorePercent));
        candidate.setScore(roundToOneDecimal((directAiScorePercent / 100.0) * 10.0));
        candidate.setAccepted(directAiScorePercent >= QUALIFIED_THRESHOLD);
        logger.info("Set scores for candidate {} based on direct AI match_score: Match={}%, Score={}, Accepted={}",
                candidate.getId(),
                candidate.getMatchPercentage(),
                candidate.getScore(),
                candidate.getAccepted());
    }

    private double roundToOneDecimal(double value) {
        if (Double.isNaN(value) || Double.isInfinite(value)) {
            logger.warn("Attempted to round NaN or Infinite value, returning 0.0");
            return 0.0;
        }
        return Math.round(value * 10.0) / 10.0;
    }
}