package com.example.PortailRH.Service;

import com.example.PortailRH.Model.Candidature;
import com.example.PortailRH.Model.candidat;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class ScoreCalculationService {

    private static final Logger logger = LoggerFactory.getLogger(ScoreCalculationService.class);

    // Define the threshold percentage for a candidate to be considered "qualified" automatically
    private static final double QUALIFIED_THRESHOLD_PERCENTAGE = 65.0; // Example: 65% match required

    /**
     * Calculates the match score and percentage for a candidate against a specific job posting.
     * Updates the score, matchPercentage, and accepted fields on the candidate object directly.
     *
     * @param candidate  The candidate object (expects AI results populated for skills/languages).
     * @param jobPosting The Candidature (job posting) object containing required skills map.
     */
    public void calculateScore(candidat candidate, Candidature jobPosting) {
        if (candidate == null) {
            logger.error("Cannot calculate score: Candidate object is null.");
            // Cannot set defaults if candidate is null
            return;
        }
        if (jobPosting == null) {
            logger.warn("Cannot calculate score for candidate {}: JobPosting object is null. Setting default scores.", candidate.getId());
            setDefaultScores(candidate);
            return;
        }

        Map<String, Integer> requiredSkills = jobPosting.getSkillsWithPercentage();
        Map<String, Double> candidateTechSkills = candidate.getTechnicalSkills();
        Map<String, Double> candidateLangSkills = candidate.getLanguageSkills();

        if (requiredSkills == null || requiredSkills.isEmpty()) {
            logger.warn("Cannot calculate score for candidate {} against job {}: JobPosting has no required skills defined. Setting default scores.",
                    candidate.getId(), jobPosting.getId());
            setDefaultScores(candidate);
            return;
        }

        // Ensure candidate skill maps are not null, even if AI failed to populate them
        if (candidateTechSkills == null) candidateTechSkills = new HashMap<>();
        if (candidateLangSkills == null) candidateLangSkills = new HashMap<>();

        // Normalize skill names for case-insensitive comparison
        Map<String, Double> normalizedCandidateTechSkills = normalizeKeys(candidateTechSkills);
        Map<String, Double> normalizedCandidateLangSkills = normalizeKeys(candidateLangSkills);

        double totalScoreAchieved = 0.0;
        double totalPossibleWeight = 0.0; // Use sum of weights from job posting requirements

        logger.debug("Calculating score for Candidate ID: {}, Job ID: {}", candidate.getId(), jobPosting.getId());
        logger.debug("Required Skills: {}", requiredSkills);
        logger.debug("Normalized Candidate Tech Skills: {}", normalizedCandidateTechSkills);
        logger.debug("Normalized Candidate Lang Skills: {}", normalizedCandidateLangSkills);


        for (Map.Entry<String, Integer> requiredEntry : requiredSkills.entrySet()) {
            String requiredSkillName = requiredEntry.getKey();
            Integer requiredWeight = requiredEntry.getValue();

            if (requiredSkillName == null || requiredSkillName.isBlank() || requiredWeight == null || requiredWeight <= 0) {
                logger.warn("Skipping invalid requirement in job {}: Skill='{}', Weight={}", jobPosting.getId(), requiredSkillName, requiredWeight);
                continue; // Skip invalid requirements
            }

            String normalizedRequiredSkill = requiredSkillName.toLowerCase().trim();
            totalPossibleWeight += requiredWeight; // Summing the weights defined in the job posting

            double candidateProficiency = 0.0; // Default proficiency if skill not found

            // Check technical skills first
            if (normalizedCandidateTechSkills.containsKey(normalizedRequiredSkill)) {
                candidateProficiency = normalizedCandidateTechSkills.get(normalizedRequiredSkill);
                logger.trace("Candidate {} - Found tech skill match: '{}' (Proficiency: {})", candidate.getId(), requiredSkillName, candidateProficiency);
            }
            // Check language skills if not found in technical
            else if (normalizedCandidateLangSkills.containsKey(normalizedRequiredSkill)) {
                candidateProficiency = normalizedCandidateLangSkills.get(normalizedRequiredSkill);
                logger.trace("Candidate {} - Found language skill match: '{}' (Proficiency: {})", candidate.getId(), requiredSkillName, candidateProficiency);
            } else {
                logger.trace("Candidate {} - Required skill '{}' not found.", candidate.getId(), requiredSkillName);
            }

            // Clamp proficiency between 0 and 100
            candidateProficiency = Math.max(0.0, Math.min(100.0, candidateProficiency));

            // Score contribution = Importance_Weight * (Candidate_Skill_Level / 100)
            double scoreContribution = requiredWeight * (candidateProficiency / 100.0);
            totalScoreAchieved += scoreContribution;

            logger.trace(" -> Skill: '{}', Weight: {}, Proficiency: {}, Contribution: {}",
                    requiredSkillName, requiredWeight, candidateProficiency, scoreContribution);
        }

        double matchPercentage = 0.0;
        if (totalPossibleWeight > 0) {
            matchPercentage = (totalScoreAchieved / totalPossibleWeight) * 100.0;
            // Ensure percentage doesn't exceed 100 due to potential rounding or odd weights
            matchPercentage = Math.min(100.0, matchPercentage);
        } else {
            logger.warn("Total possible weight for job {} requirements is 0. Match percentage cannot be calculated.", jobPosting.getId());
        }

        // Round scores for cleaner presentation (optional, consider precision needs)
        double finalScore = Math.round(totalScoreAchieved * 10.0) / 10.0; // One decimal place
        double finalMatchPercentage = Math.round(matchPercentage * 10.0) / 10.0; // One decimal place

        // Determine 'accepted' status based on the calculated match percentage
        boolean accepted = finalMatchPercentage >= QUALIFIED_THRESHOLD_PERCENTAGE;

        logger.info("Score Calculation Complete for Candidate ID: {}, Job ID: {}", candidate.getId(), jobPosting.getId());
        logger.info(" -> Total Achieved Score: {:.2f}", totalScoreAchieved);
        logger.info(" -> Total Possible Weight: {:.2f}", totalPossibleWeight);
        logger.info(" -> Calculated Match Percentage: {:.1f}% (Threshold: {}%)", finalMatchPercentage, QUALIFIED_THRESHOLD_PERCENTAGE);
        logger.info(" -> Final Status (Accepted): {}", accepted);

        // Update the candidate object directly with calculated values
        candidate.setScore(finalScore); // Could also use totalScoreAchieved if rounding isn't desired
        candidate.setMatchPercentage(finalMatchPercentage);
        candidate.setAccepted(accepted);
    }

    /** Helper to set default scores/status on a candidate object. */
    private void setDefaultScores(candidat candidate) {
        if (candidate != null) {
            candidate.setScore(0.0);
            candidate.setMatchPercentage(0.0);
            candidate.setAccepted(false);
            logger.debug("Set default scores for candidate {}", candidate.getId());
        }
    }

    /** Helper to normalize map keys (lowercase, trimmed) for comparison. */
    private <V> Map<String, V> normalizeKeys(Map<String, V> map) {
        if (map == null) {
            return Map.of(); // Return immutable empty map
        }
        Map<String, V> normalizedMap = new HashMap<>();
        for (Map.Entry<String, V> entry : map.entrySet()) {
            if (entry.getKey() != null && !entry.getKey().isBlank()) {
                normalizedMap.put(entry.getKey().toLowerCase().trim(), entry.getValue());
            } else {
                logger.warn("Skipping map entry with null or blank key during normalization.");
            }
        }
        return normalizedMap;
    }
}