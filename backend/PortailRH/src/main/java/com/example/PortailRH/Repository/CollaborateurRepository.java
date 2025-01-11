package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.Collaborateur;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
@Repository

public interface CollaborateurRepository extends MongoRepository<Collaborateur, String> {
    Optional<Collaborateur> findByMatricule(String code);
    Optional<Collaborateur> findByEmail(String email);
}
