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

        // 5. Send professional verification email
        String emailSubject = "Activation de votre compte chez ArabSoft";
        String emailBody = "<p>Bonjour " + personnel.getPrenom() + ",</p>" +
                "<p>Nous sommes heureux de vous informer que votre compte a été activé avec succès par l'administrateur de la société ArabSoft.</p>" +
                "<p>Vous pouvez maintenant vous connecter en utilisant votre matricule : " + personnel.getMatricule() + ".</p>" +
                "<p>Votre rôle est : " + role.getLibelle() + ".</p>" +
                "<p>Nous vous souhaitons plein de succès dans vos nouvelles fonctions.</p>" +
                "<p>Cordialement,</p>" +
                "<p>L'équipe ArabSoft</p>";
        emailService.sendVerificationEmail(personnel.getEmail(), emailSubject, emailBody);
    }

    /**
     * Deactivate the collaborator by ID
     */
    public void desactivateCollaborateur(String id) throws MessagingException {
        Personnel personnel = personnelRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Collaborateur introuvable"));

        // Deactivate the collaborator
        personnel.desactivateCollaborateur(personnel.getRole());
        personnelRepository.save(personnel);

        // Send professional deactivation email
        String emailSubject = "Désactivation de votre compte chez ArabSoft";
        String emailBody = "<p>Bonjour " + personnel.getPrenom() + ",</p>" +
                "<p>Nous vous remercions pour votre collaboration avec ArabSoft. Votre compte a été désactivé avec succès par l'administrateur.</p>" +
                "<p>Nous vous souhaitons tout le meilleur pour l'avenir et espérons avoir l'occasion de collaborer à nouveau avec vous.</p>" +
                "<p>Cordialement,</p>" +
                "<p>L'équipe ArabSoft</p>";
        emailService.sendVerificationEmail(personnel.getEmail(), emailSubject, emailBody);
    }
}

