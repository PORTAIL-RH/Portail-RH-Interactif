package com.example.PortailRH.Model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.HashSet;
import java.util.Set;

@Document(collection = "AdminUser")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminUser {

    @Id
    private String id;

    @NotBlank(message = "Le matricule est obligatoire")
    private String matricule;

    @NotBlank(message = "Le nom est obligatoire")
    private String nom;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "L'email doit être valide")
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    private String motDePasse;

    private Set<String> roles = new HashSet<>();

    private boolean active = false;  // Default to false until activated

    // Method to assign a role
    public void assignRole(String role) {
        this.roles.add(role);
    }

    // Method to activate the user
    public void activateUser(Set<String> roles) {
        this.active = true;
        this.roles.addAll(roles);  // Add the roles to the user
    }

    // Method to deactivate a user
    public void deactivateUser() {
        this.active = false;
    }
}
