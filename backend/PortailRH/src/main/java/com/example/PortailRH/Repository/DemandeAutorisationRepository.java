package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.DemandeAutorisation;
import com.example.PortailRH.Model.Reponse;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DemandeAutorisationRepository extends MongoRepository<DemandeAutorisation, String> {
    List<DemandeAutorisation> findByMatPers_Id(String matPersId);
    List<DemandeAutorisation> findByMatPersIdIn(List<String> personnelIds);
    List<DemandeAutorisation> findByReponseChef(Reponse reponse);
    List<DemandeAutorisation> findByIdIn(List<String> ids);


    @Query("{ 'matPers._id': ?0, 'responseChefs.responseChef1': ?1 }")
    List<DemandeAutorisation> findByMatPersIdAndResponseChefs_ResponseChef1(
            String matPersId,
            String responseChef1
    );

    @Query("{ 'matPers._id': ?0, $or: [ " +
            "{ 'responseChefs.responseChef1': 'O' }, " +
            "{ 'responseChefs.responseChef2': 'O' }, " +
            "{ 'responseChefs.responseChef3': 'O' } " +
            "] }")
    List<DemandeAutorisation> findApprovedByPersonnelId(String matPersId);

}
