package com.example.PortailRH.Service;

import com.example.PortailRH.Model.AdminUser;
import com.example.PortailRH.Model.Personnel;
import com.example.PortailRH.Model.Service;
import com.example.PortailRH.Repository.AdminUserRepository;
import com.example.PortailRH.Repository.PersonnelRepository;
import com.example.PortailRH.Repository.ServiceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@org.springframework.stereotype.Service
public class AdminUserService {
    private static final Logger logger = LoggerFactory.getLogger(AdminUserService.class);

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
        Personnel personnel = personnelRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Collaborateur non trouvé avec l'ID : " + id));

        Service service = null;
        if ((role.equals("collaborateur") || role.equals("Chef Hiérarchique")|| role.equals("RH"))) {
            if (serviceId == null || serviceId.isEmpty()) {
                throw new IllegalArgumentException("Service ID is required.");
            }
            service = serviceRepository.findById(serviceId)
                    .orElseThrow(() -> new IllegalArgumentException("Service non trouvé avec l'ID : " + serviceId));
        }

        personnel.activateCollaborateur(role, service);
        personnelRepository.save(personnel);

        sendActivationEmail(personnel, role, service);
    }

    /**
     * Deactivate a collaborator by ID.
     * @param id The ID of the collaborator to deactivate.
     * @throws IllegalArgumentException If the collaborator is not found.
     */
    public void desactivateCollaborateur(String id) {
        Personnel personnel = personnelRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Collaborateur non trouvé avec l'ID : " + id));

        personnel.desactivateCollaborateur();
        personnelRepository.save(personnel);

        sendDeactivationEmail(personnel);
    }

    public void registerAdminUser(AdminUser adminUser) {
        if (adminUserRepository.findByEmail(adminUser.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already exists!");
        }

        adminUser.setMotDePasse(passwordEncoder.encode(adminUser.getMotDePasse()));
        adminUserRepository.save(adminUser);
    }

    private void sendActivationEmail(Personnel personnel, String role, Service service) {
        String subject = "Account Activation";
        String body = "Dear " + personnel.getNom() + ",\n\n" +
                "Your account has been activated with the role: " + role + ".\n" +
                (service != null ? "Service: " + service.getServiceName() + ".\n\n" : "\n\n") +
                "Best regards,\nYour Company";

        try {
            emailService.sendHtmlEmail(personnel.getEmail(), subject, body);
        } catch (Exception e) {
            logger.error("Failed to send activation email to {}", personnel.getEmail(), e);
            // Continue without throwing exception since the main operation succeeded
        }
    }

    private void sendDeactivationEmail(Personnel personnel) {
        String subject = "Account Deactivation";
        String body = "Dear " + personnel.getNom() + ",\n\n" +
                "Your account has been deactivated.\n\n" +
                "Best regards,\nYour Company";

        try {
            emailService.sendHtmlEmail(personnel.getEmail(), subject, body);
        } catch (Exception e) {
            logger.error("Failed to send deactivation email to {}", personnel.getEmail(), e);
            // Continue without throwing exception since the main operation succeeded
        }
    }
}