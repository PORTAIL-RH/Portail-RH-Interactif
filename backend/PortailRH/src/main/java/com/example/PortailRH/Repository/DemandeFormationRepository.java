package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.DemandeFormation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DemandeFormationRepository extends MongoRepository<DemandeFormation, String> {
    List<DemandeFormation> findByMatPersId(String matPersId);

}
