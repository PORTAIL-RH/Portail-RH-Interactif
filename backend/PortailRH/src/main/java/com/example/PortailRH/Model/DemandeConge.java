package com.example.PortailRH.Model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collection;
import java.util.Date;
import java.util.concurrent.TimeUnit;

@Data
@Document(collection = "Demandes_Conge")

public class DemandeConge {
    public static final int MAX_DAYS_PER_YEAR = 80;

    @Id
    private String id_libre_demande;
    private Date dateDemande = new Date();
    private String typeDemande;

    @DBRef
    private Personnel matPers;
    private String codeSoc;
    private Date dateDebut;
    private Date dateFin;
    private String snjTempDep;
    private String snjTempRetour;
    private int nbrJours;


    private int year;
    private String texteDemande;

    private Reponse reponseChef = Reponse.I;
    private Reponse reponseRH = Reponse.I;
    private String observation;
    @DBRef(lazy = true) // Relation avec les fichiers joints
    private Collection<Fichier_joint> Files = new ArrayList<>(); // Ensure this field exists

    public DemandeConge() {
        // Initialiser l'année avec l'année courante
        Calendar cal = Calendar.getInstance();
        this.year = cal.get(Calendar.YEAR);
    }

    public void setDateDebut(Date dateDebut) {
        this.dateDebut = dateDebut;
        calculateDateReprisePrevAndNbrJours();
        // Mettre à jour l'année si la date de début change
        if (dateDebut != null) {
            Calendar cal = Calendar.getInstance();
            cal.setTime(dateDebut);
            this.year = cal.get(Calendar.YEAR);
        }
    }

    public void setDateFin(Date dateFin) {
        this.dateFin = dateFin;
        calculateDateReprisePrevAndNbrJours();
    }

    private void calculateDateReprisePrevAndNbrJours() {
        if (this.dateDebut != null && this.dateFin != null) {
            long diffInMillies = Math.abs(dateFin.getTime() - dateDebut.getTime());
            this.nbrJours = (int) TimeUnit.DAYS.convert(diffInMillies, TimeUnit.MILLISECONDS) + 1; // +1 pour inclure le premier jour
        }
    }





    public String getId() {
        return id_libre_demande;
    }

    public String getObservation() {
        return observation;
    }

    public void setObservation(String observation) {
        this.observation = observation;
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

    // CodeSoc will be derived dynamically from Personnel object
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

    public void setDateDemande(Date dateDemande) {
        this.dateDemande = dateDemande;
    }
}
