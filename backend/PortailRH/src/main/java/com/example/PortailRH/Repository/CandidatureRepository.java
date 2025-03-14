package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.Candidature;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CandidatureRepository extends MongoRepository<Candidature, String> {

}