package com.example.PortailRH.Model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;

@Document(collection = "Demandes_Document")

public class DemandeDocument {
    @Id
    private String id;
    private String typeDemande;
    private Date dateDemande = new Date();


    private String typeDocument;
    @DBRef
    private Personnel matPers;
    private String TexteDemande;
    private Reponse reponseChef = Reponse.I;
    private Reponse reponseRH = Reponse.I;
    private String codeSoc;
    @DBRef(lazy = true)
    private Collection<Fichier_joint> Files = new ArrayList<>();

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

    // CodeSoc will be derived dynamically from Personnel object
    /*public String getCodeSoc() {
        return matPers != null ? matPers.getCode_soc() : null;
    }*/

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

    public void setDateDemande(Date dateDemande) {
        this.dateDemande = dateDemande;
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
