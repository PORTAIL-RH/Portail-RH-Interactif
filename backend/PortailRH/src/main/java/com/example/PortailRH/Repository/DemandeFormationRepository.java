package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.DemandeFormation;
import com.example.PortailRH.Model.Reponse;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DemandeFormationRepository extends MongoRepository<DemandeFormation, String> {
    List<DemandeFormation> findByMatPersId(String matPersId);
    List<DemandeFormation> findByReponseChef(Reponse reponse);
    List<DemandeFormation> findByMatPersIdAndReponseChef(String matPersId, Reponse reponseChef);
    List<DemandeFormation> findByIdIn(List<String> ids);

    @Query("{ 'matPers._id': ?0, 'responseChefs.responseChef1': ?1 }")
    List<DemandeFormation> findByMatPersIdAndResponseChefs_ResponseChef1(
            String matPersId,
            String responseChef1
    );

    @Query("{ 'matPers._id': ?0, $or: [ " +
            "{ 'responseChefs.responseChef1': 'O' }, " +
            "{ 'responseChefs.responseChef2': 'O' }, " +
            "{ 'responseChefs.responseChef3': 'O' } " +
            "] }")
    List<DemandeFormation> findApprovedByPersonnelId(String matPersId);

}
