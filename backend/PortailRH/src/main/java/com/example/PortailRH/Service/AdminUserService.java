package com.example.PortailRH.Service;

import com.example.PortailRH.Model.Collaborateur;
import com.example.PortailRH.Model.Role;
import com.example.PortailRH.Repository.CollaborateurRepository;
import com.example.PortailRH.Repository.RoleRepository;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AdminUserService {

    private final CollaborateurRepository collaborateurRepository;  // Injected by Spring
    private final RoleRepository roleRepository;  // Injected by Spring

    // Constructeur pour l'injection des dépendances
    public AdminUserService(CollaborateurRepository collaborateurRepository, RoleRepository roleRepository) {
        this.collaborateurRepository = collaborateurRepository;
        this.roleRepository = roleRepository;
    }

    /**
     * Activer un collaborateur et lui attribuer des rôles
     */
    public void activateCollaborateur(String id, Set<String> roleLibelles) {
        // Trouver le collaborateur par ID
        Collaborateur collaborateur = collaborateurRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Collaborateur non trouvé"));

        // Récupérer les rôles basés sur les libellés fournis
        Set<Role> roles = roleLibelles.stream()
                .map(libelle -> roleRepository.findByLibelle(libelle)
                        .orElseThrow(() -> new IllegalArgumentException("Role non trouvé: " + libelle)))
                .collect(Collectors.toSet());

        // Activer le collaborateur et lui attribuer les rôles
        collaborateur.activateCollaborateur(roles.stream().map(Role::getLibelle).collect(Collectors.toSet()));  // En supposant que vous voulez stocker les libellés des rôles

        // Sauvegarder le collaborateur mis à jour
        collaborateurRepository.save(collaborateur);
    }
}
