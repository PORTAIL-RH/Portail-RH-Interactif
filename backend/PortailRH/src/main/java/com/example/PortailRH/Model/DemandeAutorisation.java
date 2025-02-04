package com.example.PortailRH.Model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.List;

@Data
@Document(collection = "Demandes_Autorisation")
public class DemandeAutorisation {

    @Id
    private String id_libre_demande;

    private Date dateDebut;
    private Date dateFin;
    private Date dateDemande = new Date();
    private String typeDemande;

    @DBRef
    private Personnel matPers;
    private String codeSoc;
    private String texteDemande;

    private Reponse reponseChef = Reponse.I;
    private Reponse reponseRH = Reponse.I;

    //@DBRef(lazy = true) // Lazy relationship with attached files
    //private Collection<Fichier_joint> files = new ArrayList<>();
    private List<Fichier_joint> files = new ArrayList<>();

    private Date heureSortie;
    private Date heureRetour;
    private String codAutorisation;

    // Getters and Setters

    public String getId_libre_demande() {
        return id_libre_demande;
    }

    public void setId_libre_demande(String id_libre_demande) {
        this.id_libre_demande = id_libre_demande;
    }

    public Date getDateDebut() {
        return dateDebut;
    }

    public void setDateDebut(Date dateDebut) {
        this.dateDebut = dateDebut;
    }

    public Date getDateFin() {
        return dateFin;
    }

    public void setDateFin(Date dateFin) {
        this.dateFin = dateFin;
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

    public void setFiles(List<Fichier_joint> files) {
        this.files = files;
    }

    public Date getHeureSortie() {
        return heureSortie;
    }

    public void setHeureSortie(Date heureSortie) {
        this.heureSortie = heureSortie;
    }

    public Date getHeureRetour() {
        return heureRetour;
    }

    public void setHeureRetour(Date heureRetour) {
        this.heureRetour = heureRetour;
    }

    public String getCodAutorisation() {
        return codAutorisation;
    }

    public void setCodAutorisation(String codAutorisation) {
        this.codAutorisation = codAutorisation;
    }
}
