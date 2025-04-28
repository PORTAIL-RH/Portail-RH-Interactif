package com.example.PortailRH.Model;

import com.fasterxml.jackson.annotation.JsonFormat;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;

@Document(collection = "Demandes_Document")
public class DemandeDocument {
    @Id
    private String id;
    private String typeDemande;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSX", timezone = "UTC")
    private Date dateDemande = new Date();    private String typeDocument;

    @DBRef
    private Personnel matPers;
    private String TexteDemande;
    private Reponse reponseChef = Reponse.I;
    private Reponse reponseRH = Reponse.I;
    private String codeSoc;

    @DBRef(lazy = true)
    private Collection<Fichier_joint> Files = new ArrayList<>();

    @DBRef(lazy = true)
    private Collection<Fichier_joint> FilesReponse = new ArrayList<>();

    // Helper method to parse dates from different formats
    /*private Date parseDate(Object dateInput) {
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
    }*/

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

    // Rest of the getters and setters remain the same
    public String getTexteDemande() {
        return TexteDemande;
    }

    public void setTexteDemande(String texteDemande) {
        TexteDemande = texteDemande;
    }

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

    public Personnel getMatPers() {
        return matPers;
    }

    public void setMatPers(Personnel matPers) {
        this.matPers = matPers;
    }

    public String getCollaborateurId() {
        return (matPers != null) ? matPers.getId() : null;
    }

    public Collection<Fichier_joint> getFilesReponse() {
        return FilesReponse;
    }

    public void setFilesReponse(Collection<Fichier_joint> filesReponse) {
        FilesReponse = filesReponse;
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

    public Date getDateDemande() {
        return dateDemande;
    }

    public String getCodeSoc() {
        return codeSoc;
    }

    public void setCodeSoc(String codeSoc) {
        this.codeSoc = codeSoc;
    }

    public Collection<Fichier_joint> getFiles() {
        return Files;
    }

    public void setFiles(Collection<Fichier_joint> files) {
        this.Files = files;
    }

    public String getTypeDocument() {
        return typeDocument;
    }

    public void setTypeDocument(String typeDocument) {
        this.typeDocument = typeDocument;
    }
}