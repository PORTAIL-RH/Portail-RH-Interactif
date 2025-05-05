package com.example.PortailRH.Model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

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
    private Reponse reponseChef;
    private Reponse reponseRH;

    @DBRef(lazy = true)
    private Collection<Fichier_joint> files;

    private int heureSortie;
    private int heureRetour;
    private int horaireSortie;  // Fixed: Added missing field
    private int horaireRetour;  // Fixed: Removed duplicate, corrected naming
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

    // Getters and Setters

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

    public Date getDateDebut() {
        return dateDebut;
    }

    public void setDateDebut(Date dateDebut) {
        this.dateDebut = dateDebut;
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
