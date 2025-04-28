package com.example.PortailRH.Service;

import com.example.PortailRH.Model.Societe;
import com.example.PortailRH.Repository.SocieteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SocieteService {

    private final SocieteRepository societeRepository;

    @Autowired
    public SocieteService(SocieteRepository societeRepository) {
        this.societeRepository = societeRepository;
    }

    public Societe createSociete(Societe societe) {
        return societeRepository.save(societe);
    }

    public List<Societe> getAllSocietes() {
        return societeRepository.findAll();
    }

    public Societe updateSociete(String id, Societe societeDetails) {
        Optional<Societe> societeOptional = societeRepository.findById(id);
        if (societeOptional.isPresent()) {
            Societe existingSociete = societeOptional.get();
            existingSociete.setSocieteName(societeDetails.getSocieteName());
            existingSociete.setSocieteCodeSoc(societeDetails.getSocieteCodeSoc());
            existingSociete.setEmplacement(societeDetails.getEmplacement());
            return societeRepository.save(existingSociete);
        }
        return null;
    }

    public void deleteSociete(String id) {
        societeRepository.deleteById(id);
    }
}