package com.example.PortailRH.Model;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.concurrent.TimeUnit;

@Data
@Document(collection = "Demandes_Conge")
public class DemandeConge {
    @Id
    private String id_libre_demande;

    private String typeDemande;

    @DBRef
    private Personnel matPers;
    private String codeSoc;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSX", timezone = "UTC")
    private Date dateDemande = new Date();

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private Date dateDebut;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private Date dateFin;

    private String snjTempDep;
    private String snjTempRetour;
    private int nbrJours;
    private String texteDemande;
    private Reponse reponseChef = Reponse.I;
    private Reponse reponseRH = Reponse.I;

    @DBRef(lazy = true)
    private Collection<Fichier_joint> Files = new ArrayList<>();

    // Helper method to parse dates from different formats
    private Date parseDate(Object dateInput) {
        if (dateInput == null) {
            return null;
        }

        if (dateInput instanceof Date) {
            return (Date) dateInput;
        } else if (dateInput instanceof String) {
            String dateString = (String) dateInput;

            // List of supported formats (try them in order)
            String[] formats = {
                    "yyyy-MM-dd'T'HH:mm:ss.SSSX",  // ISO with timezone
                    "yyyy-MM-dd'T'HH:mm:ss.SSS",   // ISO without timezone
                    "yyyy-MM-dd'T'HH:mm:ss",       // ISO without milliseconds
                    "yyyy-MM-dd",                  // Simple date format
                    "dd/MM/yyyy"                   // French format
            };

            for (String format : formats) {
                try {
                    SimpleDateFormat sdf = new SimpleDateFormat(format);
                    sdf.setLenient(false);
                    return sdf.parse(dateString);
                } catch (ParseException e) {
                    // Try next format
                }
            }

            throw new IllegalArgumentException("Unsupported date format: " + dateString);
        } else {
            throw new IllegalArgumentException("Date input must be either Date or String");
        }
    }

    // Updated setters for dates
    public void setDateDemande(Object dateInput) {
        this.dateDemande = parseDate(dateInput);
    }

    public void setDateDebut(Object dateInput) {
        this.dateDebut = parseDate(dateInput);
        calculateDateReprisePrevAndNbrJours();
    }

    public void setDateFin(Object dateInput) {
        this.dateFin = parseDate(dateInput);
        calculateDateReprisePrevAndNbrJours();
    }

    // Private method to calculate dateReprisePrev and nbrJours
    private void calculateDateReprisePrevAndNbrJours() {
        if (this.dateDebut != null && this.dateFin != null) {
            // Calculate the difference in days
            long diffInMillies = Math.abs(dateFin.getTime() - dateDebut.getTime());
            this.nbrJours = (int) TimeUnit.DAYS.convert(diffInMillies, TimeUnit.MILLISECONDS) + 1; // +1 to include both start and end dates
        }
    }

    // Rest of the getters and setters remain the same
    public String getId() {
        return id_libre_demande;
    }

    public void setId(String id) {
        this.id_libre_demande = id;
    }

    public Date getDateDebut() {
        return dateDebut;
    }

    public Date getDateFin() {
        return dateFin;
    }

    public String getTypeDemande() {
        return typeDemande;
    }

    public void setTypeDemande(String typeDemande) {
        this.typeDemande = typeDemande;
    }

    public void setCodeSoc(String codeSoc) {
        this.codeSoc = codeSoc;
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
        return matPers != null ? matPers.getCode_soc() : null;
    }

    public String getId_libre_demande() {
        return id_libre_demande;
    }

    public void setId_libre_demande(String id_libre_demande) {
        this.id_libre_demande = id_libre_demande;
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

    public String getSnjTempDep() {
        return snjTempDep;
    }

    public void setSnjTempDep(String snjTempDep) {
        this.snjTempDep = snjTempDep;
    }

    public String getSnjTempRetour() {
        return snjTempRetour;
    }

    public void setSnjTempRetour(String snjTempRetour) {
        this.snjTempRetour = snjTempRetour;
    }

    public int getNbrJours() {
        return nbrJours;
    }

    public void setNbrJours(int nbrJours) {
        this.nbrJours = nbrJours;
    }

    public Date getDateDemande() {
        return dateDemande;
    }
}