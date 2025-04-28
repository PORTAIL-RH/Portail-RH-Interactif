package com.example.PortailRH.Model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;

@Document(collection = "Demandes_Autorisation")
public class DemandeAutorisation {

    @Id
    private String id;
    private Date dateDemande;
    private String typeDemande;

    @DBRef
    private Personnel matPers;
    private String codeSoc;
    private Date dateDebut;
    private String texteDemande;
    private Reponse reponseChef;
    private Reponse reponseRH;

    @DBRef(lazy = true)
    private Collection<Fichier_joint> files;

    private int heureSortie;
    private int heureRetour;
    private int minuteSortie;
    private int minuteRetour;
    private String codAutorisation;

    // Default constructor
    public DemandeAutorisation() {
        this.dateDemande = new Date();
        this.reponseChef = Reponse.I;
        this.reponseRH = Reponse.I;
        this.files = new ArrayList<>();
    }

    // Helper method to parse dates from different formats
    private Date parseDate(Object dateInput) {
        if (dateInput == null) {
            return null;
        }

        if (dateInput instanceof Date) {
            return (Date) dateInput;
        } else if (dateInput instanceof String) {
            String dateString = ((String) dateInput).trim();

            // List of possible date formats to try
            String[] possibleFormats = {
                    "yyyy-MM-dd'T'HH:mm:ss.SSSX",  // ISO format with timezone
                    "yyyy-MM-dd'T'HH:mm:ss.SSS",   // ISO format without timezone
                    "yyyy-MM-dd'T'HH:mm:ss",       // ISO format without milliseconds
                    "yyyy-MM-dd HH:mm:ss",         // Standard datetime format
                    "yyyy-MM-dd",                   // Simple date format
                    "dd/MM/yyyy HH:mm:ss",          // French datetime format
                    "dd/MM/yyyy",                  // French date format
                    "MM/dd/yyyy HH:mm:ss",         // US datetime format
                    "MM/dd/yyyy",                   // US date format
                    "HH:mm:ss",                     // Time only
                    "HH:mm"                         // Time without seconds
            };

            for (String format : possibleFormats) {
                try {
                    return new SimpleDateFormat(format).parse(dateString);
                } catch (ParseException e) {
                    // Try next format
                }
            }

            throw new IllegalArgumentException("Unsupported date format: " + dateString +
                    ". Supported formats include: yyyy-MM-dd, dd/MM/yyyy, yyyy-MM-dd'T'HH:mm:ss, etc.");
        } else {
            throw new IllegalArgumentException("Date input must be either Date or String");
        }
    }

    // For time fields (heureSortie, minuteSortie, etc.)
    public void setTimeFromString(String timeString, boolean isSortie) {
        if (timeString != null && !timeString.isEmpty()) {
            String[] parts = timeString.split(":");
            if (parts.length >= 2) {
                if (isSortie) {
                    this.heureSortie = Integer.parseInt(parts[0]);
                    this.minuteSortie = Integer.parseInt(parts[1]);
                } else {
                    this.heureRetour = Integer.parseInt(parts[0]);
                    this.minuteRetour = Integer.parseInt(parts[1]);
                }
            }
        }
    }

    // Updated date setters
    public void setDateDemande(Object dateInput) {
        this.dateDemande = parseDate(dateInput);
    }

    public void setDateDebut(Object dateInput) {
        this.dateDebut = parseDate(dateInput);
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Date getDateDebut() {
        return dateDebut;
    }

    public Date getDateDemande() {
        return dateDemande;
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
        return files;
    }

    public void setFiles(Collection<Fichier_joint> files) {
        this.files = files;
    }

    public int getHeureSortie() {
        return heureSortie;
    }

    public void setHeureSortie(int heureSortie) {
        this.heureSortie = heureSortie;
    }

    public int getMinuteSortie() {
        return minuteSortie;
    }

    public void setMinuteSortie(int minuteSortie) {
        this.minuteSortie = minuteSortie;
    }

    public int getHeureRetour() {
        return heureRetour;
    }

    public void setHeureRetour(int heureRetour) {
        this.heureRetour = heureRetour;
    }

    public int getMinuteRetour() {
        return minuteRetour;
    }

    public void setMinuteRetour(int minuteRetour) {
        this.minuteRetour = minuteRetour;
    }

    public String getCodAutorisation() {
        return codAutorisation;
    }

    public void setCodAutorisation(String codAutorisation) {
        this.codAutorisation = codAutorisation;
    }
}