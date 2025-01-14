package com.example.PortailRH.Service;

import com.example.PortailRH.Model.Personnel;
import com.example.PortailRH.Model.Role;

import com.example.PortailRH.Repository.PersonnelRepository;
import com.example.PortailRH.Repository.RoleRepository;
import jakarta.mail.MessagingException;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AdminUserService {

    private final PersonnelRepository personnelRepository;
    private final RoleRepository roleRepository;
    private final EmailService emailService;  // Inject the email service

    public AdminUserService(PersonnelRepository personnelRepository, RoleRepository roleRepository, EmailService emailService) {
        this.personnelRepository = personnelRepository;
        this.roleRepository = roleRepository;
        this.emailService = emailService;
    }

    public void activateCollaborateur(String id, Set<String> roleLibelles) throws MessagingException {
        // Find the collaborator by ID
        Personnel personnel = personnelRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Collaborateur non trouvé"));

        // Get roles based on the role labels provided
        Set<Role> roles = roleLibelles.stream()
                .map(libelle -> roleRepository.findByLibelle(libelle)
                        .orElseThrow(() -> new IllegalArgumentException("Role non trouvé: " + libelle)))
                .collect(Collectors.toSet());

        // Activate the collaborator and assign the roles
        personnel.activateCollaborateur(roles.stream().map(Role::getLibelle).collect(Collectors.toSet()));

        // Save the updated collaborator
        personnelRepository.save(personnel);

        // Send verification email
        String emailSubject = "Verification de votre compte";
        String emailBody = "<p>Bonjour " + personnel.getPrenom()+ ",</p>" +
                "<p>Votre compte a été activé avec succès. vous pouvez se connecter maintenant en utilisant votre matricule :  " + personnel.getMatricule()+ "</p>"+ "<p>votre role est : "+ personnel.getRole()+"</p>";

        emailService.sendVerificationEmail(personnel.getEmail(), emailSubject, emailBody);
    }
}
