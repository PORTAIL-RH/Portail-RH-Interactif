package com.example.Portail_RH.Repository;

import com.example.Portail_RH.Model.Collaborateur;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface CollaborateurRepository extends MongoRepository<Collaborateur,String> {
    Optional<Collaborateur> findByCode(String Code);

}
