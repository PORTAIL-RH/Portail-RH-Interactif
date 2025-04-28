package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.DemandeFormation;
import com.example.PortailRH.Model.Reponse;
import com.example.PortailRH.Model.Service;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DemandeFormationRepository extends MongoRepository<DemandeFormation, String> {
    List<DemandeFormation> findByMatPersId(String matPersId);
    List<DemandeFormation> findByReponseChef(Reponse reponse);
    List<DemandeFormation> findByMatPersIdAndReponseChef(String matPersId, Reponse reponseChef);
}
