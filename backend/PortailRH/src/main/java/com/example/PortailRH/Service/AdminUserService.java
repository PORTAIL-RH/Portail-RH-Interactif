package com.example.PortailRH.Service;

import com.example.PortailRH.Model.Personnel;
import com.example.PortailRH.Model.Role;
import com.example.PortailRH.Repository.PersonnelRepository;
import com.example.PortailRH.Repository.RoleRepository;
import jakarta.mail.MessagingException;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AdminUserService {
    private final PersonnelRepository personnelRepository;
    private final RoleRepository roleRepository;
    private final EmailService emailService;

    public AdminUserService(PersonnelRepository personnelRepository, RoleRepository roleRepository, EmailService emailService) {
        this.personnelRepository = personnelRepository;
        this.roleRepository = roleRepository;
        this.emailService = emailService;
    }

    public void activateCollaborateur(String id, String roleLibelle) throws MessagingException {
        // Log the roleLibelle received
        System.out.println("Libellé reçu pour le rôle: '" + roleLibelle + "'");

        // 1. Find the personnel by their ID
        Personnel personnel = personnelRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Collaborateur non trouvé"));

        // 2. Clean up the role label to remove extra spaces and log
        String cleanLibelle = roleLibelle.trim();
        System.out.println("Libellé nettoyé: '" + cleanLibelle + "'");

        // 3. Find the role by its libelle from the database
        Optional<Role> roleOptional = roleRepository.findByLibelleIgnoreCase(cleanLibelle);

        // Debugging role search
        if (roleOptional.isPresent()) {
            System.out.println("Rôle trouvé : " + roleOptional.get().getLibelle());
        } else {
            System.out.println("Rôle avec le libellé '" + cleanLibelle + "' non trouvé");
        }

        Role role = roleOptional
                .orElseThrow(() -> new IllegalArgumentException("Rôle '" + cleanLibelle + "' non trouvé"));

        // 4. Activate the user and assign the role
        personnel.activateCollaborateur(role.getLibelle());
        personnelRepository.save(personnel);

        // 5. Send verification email
        String emailSubject = "Vérification de votre compte";
        String emailBody = "<p>Bonjour " + personnel.getPrenom() + ",</p>" +
                "<p>Votre compte a été activé avec succès. Vous pouvez vous connecter maintenant en utilisant votre matricule : "
                + personnel.getMatricule() + ".</p>" +
                "<p>Votre rôle est : " + role.getLibelle() + ".</p>";
        emailService.sendVerificationEmail(personnel.getEmail(), emailSubject, emailBody);
    }
}
