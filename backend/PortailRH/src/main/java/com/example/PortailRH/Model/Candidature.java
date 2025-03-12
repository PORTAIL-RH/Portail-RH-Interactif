package com.example.PortailRH.Model;

import org.springframework.data.mongodb.core.mapping.Document;
import jakarta.persistence.Id;
import java.util.Date;
import java.util.List;

@Document(collection = "candidatures")
public class Candidature {

    @Id
    private String id;
    private Date dateAjoutPostulation;
    private Date dateFermeturePostulation;
    private String Emplacement;
    private String description;
    private String service;
    private int anneeExperiences;
    private String exigences;
    private List<String> skills;

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
        return Emplacement;
    }

    public void setEmplacement(String emplacement) {
        Emplacement = emplacement;
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

    public List<String> getSkills() {
        return skills;
    }

    public void setSkills(List<String> skills) {
        this.skills = skills;
    }

    // Méthode pour calculer le statut dynamiquement
    public String getStatus() {
        Date aujourdHui = new Date();
        if (dateFermeturePostulation != null && aujourdHui.after(dateFermeturePostulation)) {
            return "clôturé";
        } else {
            return "disponible";
        }
    }

}