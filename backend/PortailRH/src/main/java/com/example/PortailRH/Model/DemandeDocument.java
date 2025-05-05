package com.example.PortailRH.Model;

import com.fasterxml.jackson.annotation.JsonFormat;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Document(collection = "Demandes_Document")
public class DemandeDocument {
    @Id
    private String id;
    private String typeDemande;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSX", timezone = "UTC")

    private Date dateDemande = new Date();

    private String typeDocument;
    @DBRef
    private Personnel matPers;

    @Field("TexteDemande")
    private String texteDemande;

    private Reponse reponseChef = Reponse.I;
    private Reponse reponseRH = Reponse.I;
    private String codeSoc;
    private String observation;

    @DBRef
    private List<Fichier_joint> files = new ArrayList<>();

    @DBRef
    private List<Fichier_joint> filesReponse = new ArrayList<>();

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTypeDemande() {
        return typeDemande;
    }

    public void setTypeDemande(String typeDemande) {
        this.typeDemande = typeDemande;
    }

    public void setDateDemande(Object dateInput) {
        if (dateInput == null) {
            this.dateDemande = null;
            return;
        }

        if (dateInput instanceof Date) {
            this.dateDemande = (Date) dateInput;
            return;
        }

        if (dateInput instanceof String) {
            String dateString = ((String) dateInput).trim();

            // List of all supported date formats
            String[] supportedFormats = {
                    "yyyy-MM-dd'T'HH:mm:ss.SSSX",  // ISO with timezone
                    "yyyy-MM-dd'T'HH:mm:ss.SSS",   // ISO without timezone
                    "yyyy-MM-dd'T'HH:mm:ss",       // ISO without milliseconds
                    "yyyy-MM-dd HH:mm:ss",         // Alternative format with time
                    "dd/MM/yyyy HH:mm:ss",         // French format with time
                    "yyyy-MM-dd",                 // Simple date
                    "dd/MM/yyyy",                 // French format
                    "dd-MM-yyyy",                 // Alternative format
                    "MM/dd/yyyy"                  // US format
            };

            // Try each format until one works
            for (String format : supportedFormats) {
                try {
                    SimpleDateFormat sdf = new SimpleDateFormat(format);
                    sdf.setLenient(false); // Strict parsing
                    this.dateDemande = sdf.parse(dateString);

                    // If we get here, parsing succeeded
                    return;
                } catch (ParseException e) {
                    // Try next format
                }
            }

            // If we get here, no format worked
            throw new IllegalArgumentException("Format de date non supporté: " + dateString +
                    ". Formats acceptés: yyyy-MM-dd'T'HH:mm:ss.SSSX, yyyy-MM-dd, dd/MM/yyyy, etc.");
        }

        throw new IllegalArgumentException("Le type de date doit être soit Date soit String");
    }




    public Date getDateDemande() {
        return dateDemande;
    }


    public String getTypeDocument() {
        return typeDocument;
    }

    public void setTypeDocument(String typeDocument) {
        this.typeDocument = typeDocument;
    }

    public Personnel getMatPers() {
        return matPers;
    }

    public void setMatPers(Personnel matPers) {
        this.matPers = matPers;
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

    public String getCodeSoc() {
        return codeSoc;
    }

    public void setCodeSoc(String codeSoc) {
        this.codeSoc = codeSoc;
    }

    public String getObservation() {
        return observation;
    }

    public void setObservation(String observation) {
        this.observation = observation;
    }

    public List<Fichier_joint> getFiles() {
        return files;
    }

    public void setFiles(List<Fichier_joint> files) {
        this.files = files;
    }

    public List<Fichier_joint> getFilesReponse() {
        return filesReponse;
    }

    public void setFilesReponse(List<Fichier_joint> filesReponse) {
        this.filesReponse = filesReponse;
    }
}