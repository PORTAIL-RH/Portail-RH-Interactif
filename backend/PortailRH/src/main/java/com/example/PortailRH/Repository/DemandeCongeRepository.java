package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.DemandeConge;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DemandeCongeRepository extends MongoRepository<DemandeConge, String> {
}
