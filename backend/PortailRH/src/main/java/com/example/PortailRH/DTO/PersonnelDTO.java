package com.example.PortailRH.DTO;

public class PersonnelDTO {
    private String id;
    private String matricule;
    private String nom;
    private String prenom;
    private String email;
    private String motDePasse;
    private String code_soc;
    private String date_naiss;
    private String telephone;
    private String CIN;
    private String sexe;
    private String situation;
    private int nbr_enfants;
    private String date_embauche;
    private String role;
    private boolean active;
    private String serviceId;
    private String serviceName;
    private String chefHierarchiqueId;
    private String chefHierarchiqueNom;
    private String chefHierarchiquePrenom;
    private String chefHierarchiqueMatricule;
    private String chefHierarchiqueEmail;

    public PersonnelDTO() {
    }

    public PersonnelDTO(String id, String matricule, String nom, String prenom, String email,
                        String motDePasse, String code_soc, String date_naiss, String telephone,
                        String CIN, String sexe, String situation, int nbr_enfants,
                        String date_embauche, String role, boolean active, String serviceId,
                        String serviceName, String chefHierarchiqueId, String chefHierarchiqueNom,
                        String chefHierarchiquePrenom, String chefHierarchiqueMatricule,
                        String chefHierarchiqueEmail) {
        this.id = id;
        this.matricule = matricule;
        this.nom = nom;
        this.prenom = prenom;
        this.email = email;
        this.motDePasse = motDePasse;
        this.code_soc = code_soc;
        this.date_naiss = date_naiss;
        this.telephone = telephone;
        this.CIN = CIN;
        this.sexe = sexe;
        this.situation = situation;
        this.nbr_enfants = nbr_enfants;
        this.date_embauche = date_embauche;
        this.role = role;
        this.active = active;
        this.serviceId = serviceId;
        this.serviceName = serviceName;
        this.chefHierarchiqueId = chefHierarchiqueId;
        this.chefHierarchiqueNom = chefHierarchiqueNom;
        this.chefHierarchiquePrenom = chefHierarchiquePrenom;
        this.chefHierarchiqueMatricule = chefHierarchiqueMatricule;
        this.chefHierarchiqueEmail = chefHierarchiqueEmail;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getMatricule() { return matricule; }
    public void setMatricule(String matricule) { this.matricule = matricule; }
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getMotDePasse() { return motDePasse; }
    public void setMotDePasse(String motDePasse) { this.motDePasse = motDePasse; }
    public String getCode_soc() { return code_soc; }
    public void setCode_soc(String code_soc) { this.code_soc = code_soc; }
    public String getDate_naiss() { return date_naiss; }
    public void setDate_naiss(String date_naiss) { this.date_naiss = date_naiss; }
    public String getTelephone() { return telephone; }
    public void setTelephone(String telephone) { this.telephone = telephone; }
    public String getCIN() { return CIN; }
    public void setCIN(String CIN) { this.CIN = CIN; }
    public String getSexe() { return sexe; }
    public void setSexe(String sexe) { this.sexe = sexe; }
    public String getSituation() { return situation; }
    public void setSituation(String situation) { this.situation = situation; }
    public int getNbr_enfants() { return nbr_enfants; }
    public void setNbr_enfants(int nbr_enfants) { this.nbr_enfants = nbr_enfants; }
    public String getDate_embauche() { return date_embauche; }
    public void setDate_embauche(String date_embauche) { this.date_embauche = date_embauche; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public String getServiceId() { return serviceId; }
    public void setServiceId(String serviceId) { this.serviceId = serviceId; }
    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }
    public String getChefHierarchiqueId() { return chefHierarchiqueId; }
    public void setChefHierarchiqueId(String chefHierarchiqueId) { this.chefHierarchiqueId = chefHierarchiqueId; }
    public String getChefHierarchiqueNom() { return chefHierarchiqueNom; }
    public void setChefHierarchiqueNom(String chefHierarchiqueNom) { this.chefHierarchiqueNom = chefHierarchiqueNom; }
    public String getChefHierarchiquePrenom() { return chefHierarchiquePrenom; }
    public void setChefHierarchiquePrenom(String chefHierarchiquePrenom) { this.chefHierarchiquePrenom = chefHierarchiquePrenom; }
    public String getChefHierarchiqueMatricule() { return chefHierarchiqueMatricule; }
    public void setChefHierarchiqueMatricule(String chefHierarchiqueMatricule) { this.chefHierarchiqueMatricule = chefHierarchiqueMatricule; }
    public String getChefHierarchiqueEmail() { return chefHierarchiqueEmail; }
    public void setChefHierarchiqueEmail(String chefHierarchiqueEmail) { this.chefHierarchiqueEmail = chefHierarchiqueEmail; }
}