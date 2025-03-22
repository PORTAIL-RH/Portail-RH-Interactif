package com.example.PortailRH.Model;


import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "Personnel")
@Data
@AllArgsConstructor
public class Personnel {

    @Id
    private String id;

    @NotBlank(message = "Matricule est obligatoire")
    @Pattern(regexp = "^\\d{5}$", message = "Le matricule doit être composé de 5 chiffres")
    @Indexed(unique = true)
    private String matricule;

    @NotBlank(message = "Le nom est obligatoire")
    private String nom;

    @NotBlank(message = "Le prénom est obligatoire")
    private String prenom;

    @NotBlank(message = "Email est obligatoire")
    @Email(message = "Email doit être valide")
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    private String motDePasse;

    @NotBlank(message = "Le code société est obligatoire")
    private String code_soc;

    @NotBlank(message = "La confirmation du mot de passe est obligatoire")
    private transient String confirmationMotDePasse;

    @NotBlank(message = "La date de naissance est obligatoire")
    private String date_naiss;

    @NotBlank(message = "Le numéro de téléphone est obligatoire")
    private String telephone;

    @NotBlank(message = "Le numéro de CIN est obligatoire")
    private String CIN;

    @NotBlank(message = "Le sexe est obligatoire")
    @Pattern(regexp = "male|female", message = "Le sexe doit être 'male' ou 'female'")
    private String sexe;

    @NotBlank(message = "La situation est obligatoire")
    @Pattern(regexp = "mariée|célibataire", message = "La situation doit être 'mariée' ou 'célibataire'")
    private String situation;

    private int nbr_enfants;

    @NotBlank(message = "La date d'embauche est obligatoire")
    private String date_embauche;

    private boolean active = false;
    private String role;

    @DBRef
    @JsonIgnore
    private Service service;

    @DBRef
    @JsonIgnore
    private Personnel chefHierarchique;

    public Personnel() {
    }
    // Custom constructor for creating a Personnel object with only the matricule
    public Personnel(String matricule) {
        this.matricule = matricule;
    }


    public void activateCollaborateur(String role, Service service) {
        this.active = true;
        this.role = role;
        this.service = service;

        // Check if service is null before calling getChefHierarchique()
        if (service != null) {
            this.chefHierarchique = service.getChefHierarchique();
        } else {
            // Handle the case where service is null
            this.chefHierarchique = null; // or throw an exception
            System.err.println("Service is null for role: " + role);
        }
    }
    public String getServiceName() {
        return service != null ? service.getServiceName() : "N/A";
    }
    public String getServiceId() {
        return service != null ? service.getServiceId() : null;
    }
    /**
     * Deactivates the collaborator.
     */
    public void desactivateCollaborateur() {
        this.active = false;
        this.role = null;
        this.service = null;
        this.chefHierarchique = null;
    }


    /**
     * Validates if the password and confirmation match.
     * @return true if passwords match, false otherwise.
     */
    public boolean isPasswordConfirmed() {
        return this.motDePasse != null && this.motDePasse.equals(this.confirmationMotDePasse);
    }

    public String getId() {
        return id;
    }

    public Service getService() {
        return service;
    }

    public void setService(Service service) {
        this.service = service;
    }

    public Personnel getChefHierarchique() {
        return chefHierarchique;
    }
    public static String calculateGenderPercentage(List<Personnel> personnelList) {
        if (personnelList == null || personnelList.isEmpty()) {
            return "No personnel data available.";
        }

        int total = personnelList.size();
        int femaleCount = 0;
        int maleCount = 0;

        for (Personnel personnel : personnelList) {
            if ("female".equalsIgnoreCase(personnel.getSexe())) {
                femaleCount++;
            } else if ("male".equalsIgnoreCase(personnel.getSexe())) {
                maleCount++;
            }
        }

        double femalePercentage = (femaleCount * 100.0) / total;
        double malePercentage = (maleCount * 100.0) / total;

        return String.format("Females: %.2f%%, Males: %.2f%%", femalePercentage, malePercentage);
    }
    public void setChefHierarchique(Personnel chefHierarchique) {
        this.chefHierarchique = chefHierarchique;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getMatricule() {
        return matricule;
    }

    public void setMatricule(String matricule) {
        this.matricule = matricule;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getPrenom() {
        return prenom;
    }

    public void setPrenom(String prenom) {
        this.prenom = prenom;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getMotDePasse() {
        return motDePasse;
    }

    public void setMotDePasse(String motDePasse) {
        this.motDePasse = motDePasse;
    }

    public String getCode_soc() {
        return code_soc;
    }

    public void setCode_soc(String code_soc) {
        this.code_soc = code_soc;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getConfirmationMotDePasse() {
        return confirmationMotDePasse;
    }

    public void setConfirmationMotDePasse(String confirmationMotDePasse) {
        this.confirmationMotDePasse = confirmationMotDePasse;
    }

    public String getDate_naiss() {
        return date_naiss;
    }

    public void setDate_naiss(String date_naiss) {
        this.date_naiss = date_naiss;
    }

    public String getTelephone() {
        return telephone;
    }

    public void setTelephone(String telephone) {
        this.telephone = telephone;
    }

    public String getCIN() {
        return CIN;
    }

    public void setCIN(String CIN) {
        this.CIN = CIN;
    }

    public String getSexe() {
        return sexe;
    }

    public void setSexe(String sexe) {
        this.sexe = sexe;
    }

    public String getSituation() {
        return situation;
    }

    public void setSituation(String situation) {
        this.situation = situation;
    }

    public int getNbr_enfants() {
        return nbr_enfants;
    }

    public void setNbr_enfants(int nbr_enfants) {
        this.nbr_enfants = nbr_enfants;
    }

    public String getDate_embauche() {
        return date_embauche;
    }

    public void setDate_embauche(String date_embauche) {
        this.date_embauche = date_embauche;
    }
}