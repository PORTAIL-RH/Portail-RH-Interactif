package com.example.PortailRH.Service;

import com.example.PortailRH.Controller.SseController;
import com.example.PortailRH.Model.DemandeConge;
import com.example.PortailRH.Repository.DemandeCongeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class DemandeCongeService {

    @Autowired
    private SseController sseController;

    @Autowired
    private DemandeCongeRepository demandeCongeRepository;

    public DemandeConge addDemandeConge(DemandeConge demandeConge) {
        // Save the demande to the database
        DemandeConge savedDemande = demandeCongeRepository.save(demandeConge);

        // Notify all connected clients
        sseController.sendUpdate("demande-conge", savedDemande);

        return savedDemande;
    }
}