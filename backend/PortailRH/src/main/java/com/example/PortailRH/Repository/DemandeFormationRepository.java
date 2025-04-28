package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.DemandeFormation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DemandeFormationRepository extends MongoRepository<DemandeFormation, String> {
    List<DemandeFormation> findByMatPersId(String matPersId);
    // Add this custom query for debugging
    @Query(value = "{ '_id': ?0 }", exists = true)
    boolean existsByStringId(String id);
}
