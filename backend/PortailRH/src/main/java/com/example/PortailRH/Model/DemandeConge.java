package com.example.PortailRH.Model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.concurrent.TimeUnit;

@Data
@Document(collection = "Demandes_Conge")
public class DemandeConge {

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

    @DBRef(lazy = true) // Relation avec les fichiers joints
    private Collection<Fichier_joint> Files = new ArrayList<>();



    private String snjTempDep;
    private String snjTempRetour;
    private Date dateReprisePrev;
    private int nbrJours;

    public void setDateDebut(Date dateDebut) {
        this.dateDebut = dateDebut;
        calculateDateReprisePrevAndNbrJours();
    }

    public void setDateFin(Date dateFin) {
        this.dateFin = dateFin;
        calculateDateReprisePrevAndNbrJours();
    }

    // Private method to calculate dateReprisePrev and nbrJours
    private void calculateDateReprisePrevAndNbrJours() {
        if (this.dateDebut != null && this.dateFin != null) {
            // Calculate the difference in days
            long diffInMillies = Math.abs(dateFin.getTime() - dateDebut.getTime());
            this.nbrJours = (int) TimeUnit.DAYS.convert(diffInMillies, TimeUnit.MILLISECONDS);

            // Calculate dateReprisePrev (dateFin - dateDebut)
            this.dateReprisePrev = new Date(dateDebut.getTime() + diffInMillies);
        }
    }

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

    public Collection<Fichier_joint> getPdfFiles() {
        return Files;
    }

    public void setPdfFiles(Collection<Fichier_joint> pdfFiles) {
        this.Files = pdfFiles;
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

    public Date getDateReprisePrev() {
        return dateReprisePrev;
    }

    public void setDateReprisePrev(Date dateReprisePrev) {
        this.dateReprisePrev = dateReprisePrev;
    }

    public int getNbrJours() {
        return nbrJours;
    }

    public void setNbrJours(int nbrJours) {
        this.nbrJours = nbrJours;
    }
}