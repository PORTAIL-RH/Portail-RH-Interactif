package com.example.PortailRH.Service;

import com.example.PortailRH.Model.Candidature;
import com.example.PortailRH.Model.candidat;
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
    private static final double QUALIFIED_THRESHOLD = 65.0;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public void calculateScore(candidat candidate, Candidature jobPosting) {
        logger.debug("Starting score calculation for candidate {}", candidate.getId());

        try {
            // Initialize defaults
            initializeCandidateDefaults(candidate);

            // Process AI response if available
            if (candidate.getAiResponse() != null && !candidate.getAiResponse().isEmpty()) {
                processAiResponse(candidate);
            } else {
                logger.warn("No AI response available for candidate {}", candidate.getId());
            }

            // Calculate final scores
            if (jobPosting == null || jobPosting.getSkillsWithPercentage() == null) {
                handleMissingJobPosting(candidate);
            } else {
                calculateWeightedScore(candidate, jobPosting);
            }

            logger.info("Final scores for candidate {} - Match: {}%, Score: {}, Accepted: {}",
                    candidate.getId(),
                    candidate.getMatchPercentage(),
                    candidate.getScore(),
                    candidate.getAccepted());

        } catch (Exception e) {
            logger.error("Error calculating score for candidate {}", candidate.getId(), e);
            setFallbackScores(candidate);
        }
    }

    private void initializeCandidateDefaults(candidat candidate) {
        if (candidate.getMatchedSkills() == null) candidate.setMatchedSkills(new ArrayList<>());
        if (candidate.getMissingSkills() == null) candidate.setMissingSkills(new ArrayList<>());
        if (candidate.getMatchScore() == null) candidate.setMatchScore(0.0);
        if (candidate.getMatchPercentage() == null) candidate.setMatchPercentage(0.0);
        if (candidate.getScore() == null) candidate.setScore(0.0);
        if (candidate.getAccepted() == null) candidate.setAccepted(false);
    }

    private void processAiResponse(candidat candidate) {
        try {
            JsonNode aiResponse = objectMapper.readTree(candidate.getAiResponse());
            logger.debug("Processing AI response for candidate {}", candidate.getId());

            // Extract match score
            if (aiResponse.has("match_score")) {
                candidate.setMatchScore(aiResponse.get("match_score").asDouble(0.0));
            }

            // Extract matched skills
            if (aiResponse.has("matched_skills") && aiResponse.get("matched_skills").isArray()) {
                List<String> matchedSkills = new ArrayList<>();
                for (JsonNode skillNode : aiResponse.get("matched_skills")) {
                    if (skillNode != null && skillNode.isTextual()) {
                        matchedSkills.add(skillNode.asText());
                    }
                }
                candidate.setMatchedSkills(matchedSkills);
                logger.debug("Processed {} matched skills", matchedSkills.size());
            }

            // Extract missing skills
            if (aiResponse.has("missing_skills") && aiResponse.get("missing_skills").isArray()) {
                List<String> missingSkills = new ArrayList<>();
                for (JsonNode skillNode : aiResponse.get("missing_skills")) {
                    if (skillNode != null && skillNode.isTextual()) {
                        missingSkills.add(skillNode.asText());
                    }
                }
                candidate.setMissingSkills(missingSkills);
                logger.debug("Processed {} missing skills", missingSkills.size());
            }

        } catch (Exception e) {
            logger.error("Failed to process AI response for candidate {}", candidate.getId(), e);
        }
    }

    private void calculateWeightedScore(candidat candidate, Candidature jobPosting) {
        Map<String, Integer> requiredSkills = jobPosting.getSkillsWithPercentage();
        if (requiredSkills == null || requiredSkills.isEmpty()) {
            handleMissingJobPosting(candidate);
            return;
        }

        // Normalize skill names for comparison
        Map<String, Integer> normalizedSkills = requiredSkills.entrySet().stream()
                .collect(Collectors.toMap(
                        e -> e.getKey().toLowerCase().trim(),
                        Map.Entry::getValue
                ));

        // Calculate matched weight
        double matchedWeight = candidate.getMatchedSkills().stream()
                .filter(Objects::nonNull)
                .map(String::toLowerCase)
                .map(String::trim)
                .filter(normalizedSkills::containsKey)
                .distinct()
                .mapToDouble(skill -> normalizedSkills.getOrDefault(skill, 0))
                .sum();

        double totalWeight = normalizedSkills.values().stream()
                .mapToInt(Integer::intValue)
                .sum();

        if (totalWeight <= 0) {
            logger.warn("Invalid total weight for job posting {}", jobPosting.getId());
            setFallbackScores(candidate);
            return;
        }

        // Calculate weighted percentage (0-100)
        double weightedPercentage = (matchedWeight / totalWeight) * 100.0;

        // Combine with AI score (50/50 weighting)
        double combinedScore = (candidate.getMatchScore() * 0.5) + (weightedPercentage * 0.5);

        // Set final scores
        candidate.setMatchPercentage(roundToOneDecimal(combinedScore));
        candidate.setScore(roundToOneDecimal((combinedScore / 100.0) * 10.0));
        candidate.setAccepted(combinedScore >= QUALIFIED_THRESHOLD);
    }

    private void handleMissingJobPosting(candidat candidate) {
        logger.warn("Using fallback scoring for candidate {}", candidate.getId());
        setFallbackScores(candidate);
    }

    private void setFallbackScores(candidat candidate) {
        candidate.setMatchPercentage(roundToOneDecimal(candidate.getMatchScore()));
        candidate.setScore(roundToOneDecimal((candidate.getMatchScore() / 100.0) * 10.0));
        candidate.setAccepted(candidate.getMatchScore() >= QUALIFIED_THRESHOLD);
    }

    private double roundToOneDecimal(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}