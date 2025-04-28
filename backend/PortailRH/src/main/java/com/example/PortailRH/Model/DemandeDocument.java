package com.example.PortailRH.Model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Document(collection = "Demandes_Document")
public class DemandeDocument {
    @Id
    private String id;
    private String typeDemande;
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

    public Date getDateDemande() {
        return dateDemande;
    }

    public void setDateDemande(Date dateDemande) {
        this.dateDemande = dateDemande;
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