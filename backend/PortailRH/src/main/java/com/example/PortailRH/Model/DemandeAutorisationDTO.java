package com.example.PortailRH.Model;

import com.example.PortailRH.Model.PersonnelDTO;
import com.example.PortailRH.Model.Reponse;
import java.util.Date;
import java.util.List;

public class DemandeAutorisationDTO {
    private String id;
    private Date dateDemande;
    private String typeDemande;
    private PersonnelDTO matPers;
    private String codeSoc;
    private Date dateDebut;
    private String texteDemande;
    private String observation;
    private Reponse reponseChef;
    private Reponse reponseRH;
    private List<Fichier_joint> files;
    private int heureSortie;
    private int heureRetour;
    private int horaireSortie;
    private int horaireRetour;
    private int minuteSortie;
    private int minuteRetour;
    private String codAutorisation;

    // Constructors
    public DemandeAutorisationDTO() {
    }

    public DemandeAutorisationDTO(String id, Date dateDemande, String typeDemande, PersonnelDTO matPers,
                                  String codeSoc, Date dateDebut, String texteDemande, String observation,
                                  Reponse reponseChef, Reponse reponseRH, List<Fichier_joint> files,
                                  int heureSortie, int heureRetour, int horaireSortie, int horaireRetour,
                                  int minuteSortie, int minuteRetour, String codAutorisation) {
        this.id = id;
        this.dateDemande = dateDemande;
        this.typeDemande = typeDemande;
        this.matPers = matPers;
        this.codeSoc = codeSoc;
        this.dateDebut = dateDebut;
        this.texteDemande = texteDemande;
        this.observation = observation;
        this.reponseChef = reponseChef;
        this.reponseRH = reponseRH;
        this.files = files;
        this.heureSortie = heureSortie;
        this.heureRetour = heureRetour;
        this.horaireSortie = horaireSortie;
        this.horaireRetour = horaireRetour;
        this.minuteSortie = minuteSortie;
        this.minuteRetour = minuteRetour;
        this.codAutorisation = codAutorisation;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Date getDateDemande() { return dateDemande; }
    public void setDateDemande(Date dateDemande) { this.dateDemande = dateDemande; }
    public String getTypeDemande() { return typeDemande; }
    public void setTypeDemande(String typeDemande) { this.typeDemande = typeDemande; }
    public PersonnelDTO getMatPers() { return matPers; }
    public void setMatPers(PersonnelDTO matPers) { this.matPers = matPers; }
    public String getCodeSoc() { return codeSoc; }
    public void setCodeSoc(String codeSoc) { this.codeSoc = codeSoc; }
    public Date getDateDebut() { return dateDebut; }
    public void setDateDebut(Date dateDebut) { this.dateDebut = dateDebut; }
    public String getTexteDemande() { return texteDemande; }
    public void setTexteDemande(String texteDemande) { this.texteDemande = texteDemande; }
    public String getObservation() { return observation; }
    public void setObservation(String observation) { this.observation = observation; }
    public Reponse getReponseChef() { return reponseChef; }
    public void setReponseChef(Reponse reponseChef) { this.reponseChef = reponseChef; }
    public Reponse getReponseRH() { return reponseRH; }
    public void setReponseRH(Reponse reponseRH) { this.reponseRH = reponseRH; }
    public List<Fichier_joint> getFiles() { return files; }
    public void setFiles(List<Fichier_joint> files) { this.files = files; }
    public int getHeureSortie() { return heureSortie; }
    public void setHeureSortie(int heureSortie) { this.heureSortie = heureSortie; }
    public int getHeureRetour() { return heureRetour; }
    public void setHeureRetour(int heureRetour) { this.heureRetour = heureRetour; }
    public int getHoraireSortie() { return horaireSortie; }
    public void setHoraireSortie(int horaireSortie) { this.horaireSortie = horaireSortie; }
    public int getHoraireRetour() { return horaireRetour; }
    public void setHoraireRetour(int horaireRetour) { this.horaireRetour = horaireRetour; }
    public int getMinuteSortie() { return minuteSortie; }
    public void setMinuteSortie(int minuteSortie) { this.minuteSortie = minuteSortie; }
    public int getMinuteRetour() { return minuteRetour; }
    public void setMinuteRetour(int minuteRetour) { this.minuteRetour = minuteRetour; }
    public String getCodAutorisation() { return codAutorisation; }
    public void setCodAutorisation(String codAutorisation) { this.codAutorisation = codAutorisation; }
}