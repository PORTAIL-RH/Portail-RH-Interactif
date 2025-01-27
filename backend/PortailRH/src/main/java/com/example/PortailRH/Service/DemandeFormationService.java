package com.example.PortailRH.Service;

import com.example.PortailRH.Model.DemandeFormation;
import com.example.PortailRH.Repository.DemandeFormationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class DemandeFormationService {

    @Autowired
    private DemandeFormationRepository demandeFormationRepository;

    /**
     * Crée une nouvelle demande de formation et l'enregistre en base de données.
     *
     * @param demandeFormation Les données de la demande de formation
     * @return La demande de formation créée
     */
    public DemandeFormation createDemandeFormation(DemandeFormation demandeFormation) {
        // Effectuer des validations supplémentaires si nécessaire

        // Enregistrer la demande de formation dans la base de données
        return demandeFormationRepository.save(demandeFormation);
    }
}
