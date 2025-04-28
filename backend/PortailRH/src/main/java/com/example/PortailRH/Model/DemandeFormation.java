package com.example.PortailRH.Model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;

@Data
@Document(collection = "Demandes_Formation")
public class DemandeFormation {
    @Id
    private String id_libre_demande;
    private String typeDemande;

    private Date dateDemande = new Date();

    @DBRef
    private Personnel matPers;
    private String codeSoc;
    private Date dateDebut;
    private String nbrJours;
    private String texteDemande;
    private Reponse reponseChef = Reponse.I;
    private Reponse reponseRH = Reponse.I;

    @DBRef(lazy = true)
    private Collection<Fichier_joint> Files = new ArrayList<>();

    @DBRef
    private titre titre;

    @DBRef
    private type type;

    @DBRef
    private theme theme;

    private String annee_f;  //année de la formation

    // Method to handle date parsing from different formats
    private Date parseDate(Object dateInput) {
        if (dateInput == null) {
            return null;
        }

        if (dateInput instanceof Date) {
            return (Date) dateInput;
        } else if (dateInput instanceof String) {
            String dateString = (String) dateInput;
            try {
                // Try ISO format first
                return new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSX").parse(dateString);
            } catch (ParseException e1) {
                try {
                    // Try simple date format
                    return new SimpleDateFormat("yyyy-MM-dd").parse(dateString);
                } catch (ParseException e2) {
                    try {
                        // Try French format
                        return new SimpleDateFormat("dd/MM/yyyy").parse(dateString);
                    } catch (ParseException e3) {
                        throw new IllegalArgumentException("Unsupported date format: " + dateString +
                                ". Supported formats are: yyyy-MM-dd'T'HH:mm:ss.SSSX, yyyy-MM-dd or dd/MM/yyyy");
                    }
                }
            }
        } else {
            throw new IllegalArgumentException("Date input must be either Date or String");
        }
    }

    // Updated setter methods for dates
    public void setDateDemande(Object dateInput) {
        this.dateDemande = parseDate(dateInput);
    }

    public void setDateDebut(Object dateInput) {
        this.dateDebut = parseDate(dateInput);
    }

    // Rest of the getters and setters remain the same
    public String getId_libre_demande() {
        return id_libre_demande;
    }

    public void setId_libre_demande(String id_libre_demande) {
        this.id_libre_demande = id_libre_demande;
    }

    public Date getDateDebut() {
        return dateDebut;
    }

    public Date getDateDemande() {
        return dateDemande;
    }

    public String getNbrJours() {
        return nbrJours;
    }

    public void setNbrJours(String nbrJours) {
        this.nbrJours = nbrJours;
    }

    public String getTypeDemande() {
        return typeDemande;
    }

    public void setTypeDemande(String typeDemande) {
        this.typeDemande = typeDemande;
    }

    public Personnel getMatPers() {
        return matPers;
    }

    public void setMatPers(Personnel matPers) {
        this.matPers = matPers;
    }

    public String getCollaborateurId() {
        return (matPers != null) ? matPers.getId() : null;
    }

    public String getCodeSoc() {
        return codeSoc;
    }

    public void setCodeSoc(String codeSoc) {
        this.codeSoc = codeSoc;
    }

    public String getTexteDemande() {
        return texteDemande;
    }

    public void setTexteDemande(String texteDemande) {
        this.texteDemande = texteDemande;
    }

    public Reponse getReponseChef() {
        return reponseChef;
    }

    public void setReponseChef(Reponse reponseChef) {
        this.reponseChef = reponseChef;
    }

    public Reponse getReponseRH() {
        return reponseRH;
    }

    public void setReponseRH(Reponse reponseRH) {
        this.reponseRH = reponseRH;
    }

    public Collection<Fichier_joint> getFiles() {
        return Files;
    }

    public void setFiles(Collection<Fichier_joint> files) {
        this.Files = files;
    }

    public com.example.PortailRH.Model.titre getTitre() {
        return titre;
    }

    public void setTitre(com.example.PortailRH.Model.titre titre) {
        this.titre = titre;
    }

    public com.example.PortailRH.Model.type getType() {
        return type;
    }

    public void setType(com.example.PortailRH.Model.type type) {
        this.type = type;
    }

    public com.example.PortailRH.Model.theme getTheme() {
        return theme;
    }

    public void setTheme(com.example.PortailRH.Model.theme theme) {
        this.theme = theme;
    }

    public String getAnnee_f() {
        return annee_f;
    }

    public void setAnnee_f(String annee_f) {
        this.annee_f = annee_f;
    }
}