package com.example.Portail_RH.Service;

import com.example.Portail_RH.Model.Collaborateur;
import com.example.Portail_RH.Repository.CollaborateurRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class CollaborateurService {

    @Autowired
    private CollaborateurRepository collaborateurRepository;

    public Collaborateur saveCollaborateur(Collaborateur collaborateur) {
        return collaborateurRepository.save(collaborateur);
    }
}
