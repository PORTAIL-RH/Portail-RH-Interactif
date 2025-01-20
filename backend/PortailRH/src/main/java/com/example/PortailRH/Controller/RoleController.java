package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.Role;
import com.example.PortailRH.Repository.RoleRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@RestController
@RequestMapping("/api/roles")
public class RoleController {

    @Autowired
    private RoleRepository roleRepository;

    /**
     * Ajouter un nouveau rôle
     */
    @PostMapping("/add")
    public ResponseEntity<String> addRole(@Valid @RequestBody Role role) {
        if (roleRepository.findByLibelleIgnoreCase(role.getLibelle()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Ce rôle existe déjà.");
        }
        roleRepository.save(role);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body("Rôle ajouté avec succès : " + role.getLibelle());
    }
    @GetMapping("/test-role/{libelle}")
    public ResponseEntity<?> testRole(@PathVariable String libelle) {
        return roleRepository.findByLibelleIgnoreCase(libelle)
                .map(role -> ResponseEntity.ok("Rôle trouvé : " + role.getLibelle()))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Rôle non trouvé"));
    }

    /**
     * Récupérer tous les rôles
     */
    @GetMapping
    public ResponseEntity<?> getAllRoles() {
        return ResponseEntity.ok(roleRepository.findAll());
    }

    /**
     * Supprimer un rôle par son libellé
     */
    @DeleteMapping("/delete/{libelle}")
    @Transactional
    public ResponseEntity<String> deleteRole(@PathVariable String libelle) {
        Optional<Role> role = roleRepository.findByLibelleIgnoreCase(libelle);
        if (role.isPresent()) {
            roleRepository.delete(role.get());
            return ResponseEntity.ok("Rôle supprimé avec succès : " + libelle);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Rôle introuvable.");
        }
    }
}
