package com.example.PortailRH.Service;

import com.example.PortailRH.Model.Collaborateur;
import com.example.PortailRH.Model.Role;
import com.example.PortailRH.Repository.CollaborateurRepository;
import com.example.PortailRH.Repository.RoleRepository;
import jakarta.mail.MessagingException;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AdminUserService {

    private final CollaborateurRepository collaborateurRepository;
    private final RoleRepository roleRepository;
    private final EmailService emailService;  // Inject the email service

    public AdminUserService(CollaborateurRepository collaborateurRepository, RoleRepository roleRepository, EmailService emailService) {
        this.collaborateurRepository = collaborateurRepository;
        this.roleRepository = roleRepository;
        this.emailService = emailService;
    }

    public void activateCollaborateur(String id, Set<String> roleLibelles) throws MessagingException {
        // Find the collaborator by ID
        Collaborateur collaborateur = collaborateurRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Collaborateur non trouvé"));

        // Get roles based on the role labels provided
        Set<Role> roles = roleLibelles.stream()
                .map(libelle -> roleRepository.findByLibelle(libelle)
                        .orElseThrow(() -> new IllegalArgumentException("Role non trouvé: " + libelle)))
                .collect(Collectors.toSet());

        // Activate the collaborator and assign the roles
        collaborateur.activateCollaborateur(roles.stream().map(Role::getLibelle).collect(Collectors.toSet()));

        // Save the updated collaborator
        collaborateurRepository.save(collaborateur);

        // Send verification email
        String emailSubject = "Verification de votre compte";
        String emailBody = "<p>Bonjour " + collaborateur.getNomUtilisateur() + ",</p>" +
                "<p>Votre compte a été activé avec succès. vous pouvez se connecter maintenant en utilisant votre matricule :  " +collaborateur.getMatricule()+ "</p>"+ "<p>votre role est : "+collaborateur.getRole()+"</p>";

        emailService.sendVerificationEmail(collaborateur.getEmail(), emailSubject, emailBody);
    }
}
