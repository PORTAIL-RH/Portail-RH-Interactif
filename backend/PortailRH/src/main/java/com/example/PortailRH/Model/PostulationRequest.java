package com.example.PortailRH.Model;

public class PostulationRequest {
    private String nom;
    private String prenom;
    private Integer age;
    private String email;
    private String numTel;
    private String candidatureId;
    private String cvFilePath;

    // Getters and setters
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
    public String getCandidatureId() { return candidatureId; }
    public void setCandidatureId(String candidatureId) { this.candidatureId = candidatureId; }
    public String getCvFilePath() { return cvFilePath; }
    public void setCvFilePath(String cvFilePath) { this.cvFilePath = cvFilePath; }
}