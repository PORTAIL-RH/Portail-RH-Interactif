package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.DemandeAutorisation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DemandeAutorisationRepository extends MongoRepository<DemandeAutorisation, String> {
    List<DemandeAutorisation> findByMatPersId(String matPersId);
}
