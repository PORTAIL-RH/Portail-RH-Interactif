package com.example.PortailRH.Service;

import com.example.PortailRH.Model.AdminUser;
import com.example.PortailRH.Model.Personnel;
import com.example.PortailRH.Model.Service;
import com.example.PortailRH.Repository.AdminUserRepository;
import com.example.PortailRH.Repository.PersonnelRepository;
import com.example.PortailRH.Repository.ServiceRepository;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@org.springframework.stereotype.Service
public class AdminUserService {

    private final PersonnelRepository personnelRepository;
    private final ServiceRepository serviceRepository;
    private final EmailService emailService;

    private final AdminUserRepository adminUserRepository;
    private final BCryptPasswordEncoder passwordEncoder;


    @Autowired
    public AdminUserService(PersonnelRepository personnelRepository,
                            ServiceRepository serviceRepository,
                            EmailService emailService,
                            AdminUserRepository adminUserRepository,
                            BCryptPasswordEncoder passwordEncoder) {
        this.personnelRepository = personnelRepository;
        this.serviceRepository = serviceRepository;
        this.emailService = emailService;
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Activate a collaborator by assigning a role and service.
     * @param id The ID of the collaborator to activate.
     * @param role The role to assign (e.g., "collaborateur", "chef hierarchique", "RH").
     * @param serviceId The ID of the service to which the collaborator belongs.
     * @throws IllegalArgumentException If the collaborator or service is not found.
     */
    public void activateCollaborateur(String id, String role, String serviceId) {
        // Find the collaborator by ID
        Personnel personnel = personnelRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Collaborateur non trouvé avec l'ID : " + id));

        // Validate service for "collaborateur" role
        Service service = null;
        if ((role.equals("collaborateur") || role.equals("Chef Hiérarchique"))) {
            if (serviceId == null || serviceId.isEmpty()) {
                throw new IllegalArgumentException("Service ID is required .");
            }
            service = serviceRepository.findById(serviceId)
                    .orElseThrow(() -> new IllegalArgumentException("Service non trouvé avec l'ID : " + serviceId));
        }

        // Activate the collaborator with the role and service
        personnel.activateCollaborateur(role, service);

        // Save the updated collaborator
        personnelRepository.save(personnel);

        // Send activation email
        try {
            String subject = "Account Activation";
            String body = "Dear " + personnel.getNom() + ",\n\n" +
                    "Your account has been activated with the role: " + role + ".\n" +
                    (service != null ? "Service: " + service.getServiceName() + ".\n\n" : "\n\n") +
                    "Best regards,\nYour Company";
            emailService.sendVerificationEmail(personnel.getEmail(), subject, body);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send activation email", e);
        }
    }
    /**
     * Deactivate a collaborator by ID.
     * @param id The ID of the collaborator to deactivate.
     * @throws IllegalArgumentException If the collaborator is not found.
     */
    public void desactivateCollaborateur(String id) {
        // Find the collaborator by ID
        Personnel personnel = personnelRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Collaborateur non trouvé avec l'ID : " + id));

        // Deactivate the collaborator
        personnel.desactivateCollaborateur();

        // Save the updated collaborator
        personnelRepository.save(personnel);

        // Send deactivation email
        try {
            String subject = "Account Deactivation";
            String body = "Dear " + personnel.getNom() + ",\n\n" +
                    "Your account has been deactivated.\n\n" +
                    "Best regards,\nYour Company";
            emailService.sendVerificationEmail(personnel.getEmail(), subject, body);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send deactivation email", e);
        }
    }

    public void registerAdminUser(AdminUser adminUser) {
        // Check if the email already exists
        if (adminUserRepository.findByEmail(adminUser.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already exists!");
        }

        // Encrypt the password before saving
        adminUser.setMotDePasse(passwordEncoder.encode(adminUser.getMotDePasse()));

        // Save the admin user to the database
        adminUserRepository.save(adminUser);
    }
}