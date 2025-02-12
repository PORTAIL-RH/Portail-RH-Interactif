package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.DemandeConge;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DemandeCongeRepository extends MongoRepository<DemandeConge, String> {
    List<DemandeConge> findByMatPersId(String matPersId);

}
