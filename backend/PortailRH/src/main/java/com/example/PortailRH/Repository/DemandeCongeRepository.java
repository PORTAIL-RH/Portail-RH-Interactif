package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.DemandeConge;
import com.example.PortailRH.Model.Reponse;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DemandeCongeRepository extends MongoRepository<DemandeConge, String> {
    // Find by personnel ID
    List<DemandeConge> findByIdIn(List<String> ids);

    // Standard CRUD method that will work with your @Id field
    Optional<DemandeConge> findById(String id);

    // Other existing methods
    List<DemandeConge> findByMatPersId(String matPersId);
    List<DemandeConge> findByMatPersIdAndReponseChef(String matPersId, Reponse reponseChef);
    List<DemandeConge> findByMatPersIdAndReponseChefAndYear(String matPersId, Reponse reponseChef, int year);

    @Query("{ 'matPers.service.id': ?0, 'reponseChef': 'O', 'year': ?1 }")
    List<DemandeConge> findByServiceIdAndYearAndApproved(String serviceId, int year);


    @Query("{ 'matPers._id': ?0, 'responseChefs.responseChef1': ?1 }")
    List<DemandeConge> findByMatPersIdAndResponseChefs_ResponseChef1(
            String matPersId,
            String responseChef1
    );

    @Query("{ 'matPers._id': ?0, $or: [ " +
            "{ 'responseChefs.responseChef1': 'O' }, " +
            "{ 'responseChefs.responseChef2': 'O' }, " +
            "{ 'responseChefs.responseChef3': 'O' } " +
            "] }")
    List<DemandeConge> findApprovedByPersonnelId(String matPersId);

}