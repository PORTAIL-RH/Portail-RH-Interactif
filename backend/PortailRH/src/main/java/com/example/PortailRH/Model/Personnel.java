package com.example.PortailRH.Model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Set;

@Document(collection = "Personnel")
@Data
@NoArgsConstructor
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

    @Getter @Setter
    @NotBlank(message = "Le prénom est obligatoire")
    private String prenom;

    @NotBlank(message = "Email est obligatoire")
    @Email(message = "Email doit être valide")
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    private String motDePasse;

    @NotBlank(message = "La confirmation du mot de passe est obligatoire")
    private transient String confirmationMotDePasse;

    private boolean active = false;
    private Set<String> role;

    /**
     * Activates the account and assigns roles.
     * @param roles Set of roles to assign.
     */
    public void activateCollaborateur(Set<String> roles) {
        this.active = true;
        this.role = roles;
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

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Set<String> getRole() {
        return role;
    }

    public void setRole(Set<String> role) {
        this.role = role;
    }

    public String getConfirmationMotDePasse() {
        return confirmationMotDePasse;
    }

    public void setConfirmationMotDePasse(String confirmationMotDePasse) {
        this.confirmationMotDePasse = confirmationMotDePasse;
    }
}
