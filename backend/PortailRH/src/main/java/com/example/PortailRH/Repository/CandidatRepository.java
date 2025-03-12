package com.example.PortailRH.Repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import com.example.PortailRH.Model.candidat;

import java.util.List;

@Repository
public interface CandidatRepository extends MongoRepository<candidat, String> {
    List<candidat> findByCandidaturesId(String candidatureId);

}
