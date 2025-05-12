package com.example.PortailRH.Model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
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
    @JsonManagedReference
    private Personnel matPers;

    private String codeSoc;
    private Date dateDebut;
    private String texteDemande;
    private String observation;
    @DBRef
    private Response_chefs_dem_autorisation responseChefs;
    private Reponse reponseChef;
    private Reponse reponseRH;

    @DBRef(lazy = true)
    private Collection<Fichier_joint> files;

    private int heureSortie;
    private int minuteSortie;
    private int heureRetour;
    private int minuteRetour;
    private int horaireSortie;
    private int horaireRetour;

    private String codAutorisation;

    // Constructors
    public DemandeAutorisation() {
        this.dateDemande = new Date();
        this.reponseChef = Reponse.I;
        this.reponseRH = Reponse.I;
        this.files = new ArrayList<>();
    }

    // Utility Method to Parse Date from Object
    private Date parseDate(Object dateInput) {
        if (dateInput == null) {
            return null;
        }

        if (dateInput instanceof Date) {
            return (Date) dateInput;
        } else if (dateInput instanceof String) {
            String dateString = ((String) dateInput).trim();
            String[] possibleFormats = {
                    "yyyy-MM-dd'T'HH:mm:ss.SSSX",
                    "yyyy-MM-dd'T'HH:mm:ss.SSS",
                    "yyyy-MM-dd'T'HH:mm:ss",
                    "yyyy-MM-dd HH:mm:ss",
                    "yyyy-MM-dd",
                    "dd/MM/yyyy HH:mm:ss",
                    "dd/MM/yyyy",
                    "MM/dd/yyyy HH:mm:ss",
                    "MM/dd/yyyy",
                    "HH:mm:ss",
                    "HH:mm"
            };

            for (String format : possibleFormats) {
                try {
                    return new SimpleDateFormat(format).parse(dateString);
                } catch (ParseException e) {
                    // Try next format
                }
            }

            throw new IllegalArgumentException("Unsupported date format: " + dateString);
        } else {
            throw new IllegalArgumentException("Date input must be either Date or String");
        }
    }

    // Helper method for setting time
    public void setTimeFromString(String timeString, boolean isSortie) {
        if (timeString != null && !timeString.isEmpty()) {
            String[] parts = timeString.split(":");
            if (parts.length >= 2) {
                int hour = Integer.parseInt(parts[0]);
                int minute = Integer.parseInt(parts[1]);

                if (isSortie) {
                    this.heureSortie = hour;
                    this.minuteSortie = minute;
                } else {
                    this.heureRetour = hour;
                    this.minuteRetour = minute;
                }
            }
        }
    }

    // Date setters with flexible input
    public void setDateDemande(Object dateInput) {
        this.dateDemande = parseDate(dateInput);
    }

    public Response_chefs_dem_autorisation getResponseChefs() {
        return responseChefs;
    }

    public void setResponseChefs(Response_chefs_dem_autorisation responseChefs) {
        this.responseChefs = responseChefs;
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

    public Date getDateDemande() {
        return dateDemande;
    }

    public void setDateDemande(Date dateDemande) {
        this.dateDemande = dateDemande;
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

    public String getCodeSoc() {
        return codeSoc;
    }

    public void setCodeSoc(String codeSoc) {
        this.codeSoc = codeSoc;
    }

    public Date getDateDebut() {
        return dateDebut;
    }

    public void setDateDebut(Date dateDebut) {
        this.dateDebut = dateDebut;
    }

    public String getTexteDemande() {
        return texteDemande;
    }

    public void setTexteDemande(String texteDemande) {
        this.texteDemande = texteDemande;
    }

    public String getObservation() {
        return observation;
    }

    public void setObservation(String observation) {
        this.observation = observation;
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

    public int getHoraireSortie() {
        return horaireSortie;
    }

    public void setHoraireSortie(int horaireSortie) {
        this.horaireSortie = horaireSortie;
    }

    public int getHoraireRetour() {
        return horaireRetour;
    }

    public void setHoraireRetour(int horaireRetour) {
        this.horaireRetour = horaireRetour;
    }

    public String getCodAutorisation() {
        return codAutorisation;
    }

    public void setCodAutorisation(String codAutorisation) {
        this.codAutorisation = codAutorisation;
    }
}
