package com.example.PortailRH.Model;

import com.example.PortailRH.Model.Candidature;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

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
    private List<String> matchedSkills;
    private List<String> missingSkills ;

    private String aiResponse;
// + their getters and setters

    private Double score;
    private Double matchPercentage;
    private Boolean accepted;

    @DBRef
    private List<Candidature> candidatures = new ArrayList<>();

    // Getters and Setters


    public String getAiResponse() {
        return aiResponse;
    }

    public void setAiResponse(String aiResponse) {
        this.aiResponse = aiResponse;
    }

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

    public List<String> getMatchedSkills() { return matchedSkills; }
    public void setMatchedSkills(List<String> matchedSkills) {
        this.matchedSkills = matchedSkills != null ? new ArrayList<>(matchedSkills) : new ArrayList<>();
    }

    public List<String> getMissingSkills() { return missingSkills; }
    public void setMissingSkills(List<String> missingSkills) {
        this.missingSkills = missingSkills != null ? new ArrayList<>(missingSkills) : new ArrayList<>();
    }

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

    public void addCandidature(Candidature candidature) {
        if (candidature != null) {
            if (this.candidatures == null) this.candidatures = new ArrayList<>();
            this.candidatures.add(candidature);
        }
    }
}
