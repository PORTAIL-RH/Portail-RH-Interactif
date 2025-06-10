package com.example.PortailRH.Model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.LinkedHashMap;
import java.util.Map;

@Document(collection = "candidatures")
public class Candidature {
    @Id
    private String id;
    private Date dateAjoutPostulation;
    private Date dateFermeturePostulation;
    private String emplacement;
    private String description;
    private String service;
    private int anneeExperiences;
    private String exigences;
    private Map<String, Integer> skillsWithPercentage;

    // Constructors
    public Candidature() {
        this.skillsWithPercentage = new LinkedHashMap<>();
    }

    // Constructor with just ID
    public Candidature(String id) {
        this();
        this.id = id;
    }

    // Full constructor
    public Candidature(String id, Date dateAjoutPostulation, Date dateFermeturePostulation,
                       String emplacement, String description, String service,
                       int anneeExperiences, String exigences) {
        this(id);
        this.dateAjoutPostulation = dateAjoutPostulation;
        this.dateFermeturePostulation = dateFermeturePostulation;
        this.emplacement = emplacement;
        this.description = description;
        this.service = service;
        this.anneeExperiences = anneeExperiences;
        this.exigences = exigences;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Date getDateAjoutPostulation() {
        return dateAjoutPostulation;
    }

    public void setDateAjoutPostulation(Date dateAjoutPostulation) {
        this.dateAjoutPostulation = dateAjoutPostulation;
    }

    public Date getDateFermeturePostulation() {
        return dateFermeturePostulation;
    }

    public void setDateFermeturePostulation(Date dateFermeturePostulation) {
        this.dateFermeturePostulation = dateFermeturePostulation;
    }

    public String getEmplacement() {
        return emplacement;
    }

    public void setEmplacement(String emplacement) {
        this.emplacement = emplacement;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getService() {
        return service;
    }

    public void setService(String service) {
        this.service = service;
    }

    public int getAnneeExperiences() {
        return anneeExperiences;
    }

    public void setAnneeExperiences(int anneeExperiences) {
        this.anneeExperiences = anneeExperiences;
    }

    public String getExigences() {
        return exigences;
    }

    public void setExigences(String exigences) {
        this.exigences = exigences;
    }

    public Map<String, Integer> getSkillsWithPercentage() {
        return skillsWithPercentage;
    }

    public void setSkillsWithPercentage(Map<String, Integer> skillsWithPercentage) {
        this.skillsWithPercentage = skillsWithPercentage;
    }

    // Methods for skills management
    public void addSkillWithPercentage(String skill, int percentage) throws IllegalArgumentException {
        if (percentage <= 0) {
            throw new IllegalArgumentException("Percentage must be positive");
        }

        int total = getTotalPercentage() + percentage;
        if (total > 100) {
            throw new IllegalArgumentException("Total percentage cannot exceed 100%");
        }

        this.skillsWithPercentage.put(skill, percentage);
    }

    public int getTotalPercentage() {
        return this.skillsWithPercentage.values().stream()
                .mapToInt(Integer::intValue)
                .sum();
    }

    public boolean isPercentageValid() {
        return getTotalPercentage() <= 100;
    }

    public String getStatus() {
        Date aujourdHui = new Date();
        if (dateFermeturePostulation != null && aujourdHui.after(dateFermeturePostulation)) {
            return "clôturé";
        } else {
            return "disponible";
        }
    }
}