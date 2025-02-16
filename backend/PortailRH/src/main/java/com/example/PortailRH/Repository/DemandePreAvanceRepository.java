package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.DemandePreAvance;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface DemandePreAvanceRepository extends MongoRepository<DemandePreAvance, String> {
    List<DemandePreAvance> findByMatPers_Id(String matPersId);
}