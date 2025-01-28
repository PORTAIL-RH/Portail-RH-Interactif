package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.DemandeFormation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DemandeFormationRepository extends MongoRepository<DemandeFormation, String> {
}
