package com.example.PortailRH.Model;

import com.example.PortailRH.Exception.MontantDepasseException;
import com.fasterxml.jackson.annotation.JsonFormat;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;

@Document(collection = "Demandes_Pre_Avance")
public class DemandePreAvance {

    @Id
    private String id;

    private String typeDemande = "PreAvnace";

    private String type;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSX", timezone = "UTC")
    private Date dateDemande;
    private double montant;
    private String texteDemande;

    @DBRef
    private Personnel matPers;
    private Reponse reponseChef;
    private Reponse reponseRH;
    private String codeSoc;
    @DBRef(lazy = true)
    private Collection<Fichier_joint> Files = new ArrayList<>();

    // Map pour stocker les types de pré-avances et leurs montants moyens
    private static final Map<String, Double> TYPES_PRE_AVANCE = new HashMap<>();

    static {
        TYPES_PRE_AVANCE.put("MEDICAL", 2000.0);
        TYPES_PRE_AVANCE.put("SCOLARITE", 1500.0);
        TYPES_PRE_AVANCE.put("VOYAGE", 1000.0);
        TYPES_PRE_AVANCE.put("INFORMATIQUE", 800.0);
        TYPES_PRE_AVANCE.put("DEMENAGEMENT", 3000.0);
        TYPES_PRE_AVANCE.put("MARIAGE", 5000.0);
        TYPES_PRE_AVANCE.put("FUNERAILLES", 2000.0);
    }

    // Constructeur par défaut
    public DemandePreAvance() {
        this.dateDemande = new Date();
        this.reponseChef = Reponse.I;
        this.reponseRH = Reponse.I;
    }

    public static Map<String, Double> getTypesPreAvance() {
        return TYPES_PRE_AVANCE;
    }

    // Méthode pour définir le type de demande
    public void setType(String type) {
        if (TYPES_PRE_AVANCE.containsKey(type)) {
            this.type = type;
            System.out.println("Type de demande défini : " + type);
        } else {
            throw new IllegalArgumentException("Type de demande non valide.");
        }
    }

    // Méthode pour définir le montant avec vérification
    public void setMontant(double montant) {
        if (TYPES_PRE_AVANCE.containsKey(this.type)) {
            double montantMax = TYPES_PRE_AVANCE.get(this.type);
            if (montant <= montantMax) {
                this.montant = montant;
                System.out.println("Montant défini : " + montant);
            } else {
                throw new MontantDepasseException("Vous ne devez pas dépasser " + montantMax + " euros pour ce type de demande.");
            }
        } else {
            throw new IllegalStateException("Veuillez d'abord définir un type de demande valide.");
        }
    }

    public void validateMontant() {
        if (TYPES_PRE_AVANCE.containsKey(this.type)) {
            double montantMax = TYPES_PRE_AVANCE.get(this.type);
            if (this.montant > montantMax) {
                throw new MontantDepasseException("Vous ne devez pas dépasser " + montantMax + " euros pour ce type de demande.");
            }
        } else {
            throw new IllegalStateException("Veuillez d'abord définir un type de demande valide.");
        }
    }

    // Getters et Setters (autres méthodes)

    public String getTypeDemande() {
        return typeDemande;
    }

    public void setTypeDemande(String typeDemande) {
        this.typeDemande = typeDemande;
    }

    public String getTexteDemande() {
        return texteDemande;
    }

    public void setTexteDemande(String texteDemande) {
        this.texteDemande = texteDemande;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }



    public Date getDateDemande() {
        return dateDemande;
    }

    // Modified setDateDemande to handle both Date objects and String input
    public void setDateDemande(Object dateInput) {
        if (dateInput == null) {
            this.dateDemande = null;
            return;
        }

        if (dateInput instanceof Date) {
            this.dateDemande = (Date) dateInput;
        } else if (dateInput instanceof String) {
            String dateString = (String) dateInput;
            try {
                // First try the expected format
                this.dateDemande = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSX").parse(dateString);
            } catch (ParseException e1) {
                try {
                    // Then try the simple date format
                    this.dateDemande = new SimpleDateFormat("yyyy-MM-dd").parse(dateString);
                } catch (ParseException e2) {
                    try {
                        // Then try the French format
                        this.dateDemande = new SimpleDateFormat("dd/MM/yyyy").parse(dateString);
                    } catch (ParseException e3) {
                        throw new IllegalArgumentException("Format de date non supporté: " + dateString +
                                ". Les formats acceptés sont: yyyy-MM-dd'T'HH:mm:ss.SSSX, yyyy-MM-dd ou dd/MM/yyyy");
                    }
                }
            }
        } else {
            throw new IllegalArgumentException("Le type de date doit être soit Date soit String");
        }
    }

    public double getMontant() {
        return montant;
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

    public Collection<Fichier_joint> getFiles() {
        return Files;
    }

    public void setFiles(Collection<Fichier_joint> files) {
        this.Files = files;
    }
}