package com.example.PortailRH.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.example.PortailRH.Model.candidat;

import java.util.List;

@Repository
public interface CandidatRepository extends MongoRepository<candidat, String> {
    List<candidat> findByCandidaturesId(String candidatureId);
    List<candidat> findByNomContainingIgnoreCaseOrPrenomContainingIgnoreCase(String nom, String prenom);
    @Query("SELECT COUNT(c) FROM candidat c WHERE c.candidatures.id = :positionId")
    long countByPositionId(@Param("positionId") String positionId);

    long countByCandidaturesId(String candidatureId);
    Page<candidat> findByCandidaturesId(String candidatureId, Pageable pageable);
    Page<candidat> findByNomContainingIgnoreCaseOrPrenomContainingIgnoreCase(String nom, String prenom, Pageable pageable);

}
