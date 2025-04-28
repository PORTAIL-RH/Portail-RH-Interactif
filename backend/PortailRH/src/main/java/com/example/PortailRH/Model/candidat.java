package com.example.PortailRH.Model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.*;

@Document(collection = "candidats")
public class candidat {
    @Id
    private String id;
    private String nom;
    private String prenom;
    private Integer age;
    private String email;
    private String numTel;
    private String cvFilePath;
    private Date dateCandidature = new Date();
    private Map<String, Double> technicalSkills = new HashMap<>();
    private Map<String, Double> languageSkills = new HashMap<>();
    private List<String> strengths = new ArrayList<>();
    private List<String> weaknesses = new ArrayList<>();
    private Double score;
    private Double matchPercentage;
    private Boolean accepted;

    @DBRef
    private List<Candidature> candidatures = new ArrayList<>();

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }
    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getNumTel() { return numTel; }
    public void setNumTel(String numTel) { this.numTel = numTel; }
    public String getCvFilePath() { return cvFilePath; }
    public void setCvFilePath(String cvFilePath) { this.cvFilePath = cvFilePath; }
    public Date getDateCandidature() { return dateCandidature; }
    public void setDateCandidature(Date dateCandidature) { this.dateCandidature = dateCandidature; }
    public Map<String, Double> getTechnicalSkills() { return technicalSkills; }
    public Map<String, Double> getLanguageSkills() { return languageSkills; }
    public List<String> getStrengths() { return strengths; }
    public List<String> getWeaknesses() { return weaknesses; }
    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }
    public Double getMatchPercentage() { return matchPercentage; }
    public void setMatchPercentage(Double matchPercentage) {
        this.matchPercentage = matchPercentage;
    }
    public Boolean getAccepted() { return accepted; }
    public void setAccepted(Boolean accepted) { this.accepted = accepted; }
    public List<Candidature> getCandidatures() { return candidatures; }
    public void setCandidatures(List<Candidature> candidatures) {
        this.candidatures = candidatures != null ? new ArrayList<>(candidatures) : new ArrayList<>();
    }

    // Properly handle Number to Double conversion
    public void setTechnicalSkills(Map<String, ? extends Number> technicalSkills) {
        this.technicalSkills.clear();
        if (technicalSkills != null) {
            technicalSkills.forEach((k, v) ->
                    this.technicalSkills.put(k, v != null ? v.doubleValue() : 0.0)
            );
        }
    }

    public void setLanguageSkills(Map<String, ? extends Number> languageSkills) {
        this.languageSkills.clear();
        if (languageSkills != null) {
            languageSkills.forEach((k, v) ->
                    this.languageSkills.put(k, v != null ? v.doubleValue() : 0.0)
            );
        }
    }

    public void setStrengths(List<String> strengths) {
        this.strengths = strengths != null ? new ArrayList<>(strengths) : new ArrayList<>();
    }

    public void setWeaknesses(List<String> weaknesses) {
        this.weaknesses = weaknesses != null ? new ArrayList<>(weaknesses) : new ArrayList<>();
    }

    public void addCandidature(Candidature candidature) {
        if (candidature == null) return;
        if (this.candidatures == null) {
            this.candidatures = new ArrayList<>();
        }
        this.candidatures.add(candidature);
    }

    // Helper method to safely set matchPercentage from Number
    public void setMatchPercentage(Number matchPercentage) {
        this.matchPercentage = matchPercentage != null ? matchPercentage.doubleValue() : null;
    }
}