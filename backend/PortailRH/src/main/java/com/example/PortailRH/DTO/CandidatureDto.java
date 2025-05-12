package com.example.PortailRH.DTO;

import java.util.Date;
import java.util.Map;

public class CandidatureDto {

    private Date dateAjoutPostulation;
    private Date dateFermeturePostulation;
    private String emplacement;
    private String description;
    private String service;
    private int anneeExperiences;
    private String exigences;
    private Map<String, Integer> skillsWithPercentage;

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
}
