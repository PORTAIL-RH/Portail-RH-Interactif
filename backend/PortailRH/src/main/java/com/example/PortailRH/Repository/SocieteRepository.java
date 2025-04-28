package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.Societe;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SocieteRepository extends MongoRepository<Societe, String> {
}