package com.example.PortailRH.Model;

import com.example.PortailRH.Exception.MontantDepasseException;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.*;

@Document(collection = "Demandes_Pre_Avance")
public class DemandePreAvance {

    @Id
    private String id;

    private String typeDemande="PreAvance";

    private String type;
    private Date dateDemande;
    private double montant;
    private String texteDemande;

    @DBRef
    private Personnel matPers;
    private Reponse reponseChef;
    private Reponse reponseRH;

    private String observation;
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
    public void setType(String type) {  // Renommer setTypeDemande en setType
        if (TYPES_PRE_AVANCE.containsKey(type)) {
            this.type = type;
            System.out.println("Type de demande défini : " + type);
        } else {
            throw new IllegalArgumentException("Type de demande non valide.");
        }
    }

    // Méthode pour définir le montant avec vérification
    public void setMontant(double montant) {
        if (TYPES_PRE_AVANCE.containsKey(this.type)) {  // Utiliser this.type au lieu de this.typeDemande
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
        if (TYPES_PRE_AVANCE.containsKey(this.type)) {  // Utiliser this.type au lieu de this.typeDemande
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

    public String getObservation() {
        return observation;
    }

    public void setObservation(String observation) {
        this.observation = observation;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getType() {  // Renommer getTypeDemande en getType
        return type;
    }

    public Date getDateDemande() {
        return dateDemande;
    }

    public void setDateDemande(Date dateDemande) {
        this.dateDemande = dateDemande;
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