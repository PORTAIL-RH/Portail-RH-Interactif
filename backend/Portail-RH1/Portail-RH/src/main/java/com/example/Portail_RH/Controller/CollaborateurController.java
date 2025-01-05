package com.example.Portail_RH.Controller;

import com.example.Portail_RH.Model.Collaborateur;
import com.example.Portail_RH.Repository.CollaborateurRepository;
import com.example.Portail_RH.Util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/Collaborateur")
@Validated
public class CollaborateurController {

    @Autowired
    private BCryptPasswordEncoder bCryptPasswordEncoder;

    @Autowired
    private CollaborateurRepository collaborateurRepository;

    @Autowired
    private JwtUtil jwtUtil;

    // Register Endpoint
    @PostMapping("/register")
    public ResponseEntity<?> registerCollaborateur(@RequestBody Collaborateur collaborateur) {

        // Vérification si les mots de passe correspondent
        if (!collaborateur.getMotDePasse().equals(collaborateur.getConfirmationMotDePasse())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Les mots de passe ne correspondent pas.");
        }

        // Vérification si le code est déjà utilisé
        if (collaborateurRepository.findByCode(collaborateur.getCode()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Le code collaborateur est déjà utilisé.");
        }

        // Hashage du mot de passe
        String hashedPassword = bCryptPasswordEncoder.encode(collaborateur.getMotDePasse());
        collaborateur.setMotDePasse(hashedPassword);
        collaborateur.setConfirmationMotDePasse(null); // Ne pas stocker la confirmation

        // Enregistrement dans la base de données
        try {
            collaborateurRepository.save(collaborateur);
        } catch (DuplicateKeyException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Erreur: Le code collaborateur doit être unique.");
        }

        // Génération du token avec JwtUtil
        String token = jwtUtil.generateToken(collaborateur.getNomUtilisateur());

        // Réponse avec le token
        return ResponseEntity.ok().body("Collaborateur enregistré avec succès ! Token : " + token);
    }
}
