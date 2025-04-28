package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.DemandeConge;
import com.example.PortailRH.Model.Reponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DemandeCongeRepository extends MongoRepository<DemandeConge, String> {
    List<DemandeConge> findByMatPersId(String matPersId);

    Page<DemandeConge> findByReponseChef(Reponse reponseChef, Pageable pageable);
    List<DemandeConge> findByMatPersIdAndReponseChef(String matPersId, Reponse reponseChef);
    Page<DemandeConge> findByMatPersIdIn(List<String> matPersIds, Pageable pageable);

    List<DemandeConge> findByMatPersIdAndReponseChefAndYear(String matPersId, Reponse reponseChef, int year);
    @Query("{ 'matPers.service.id': ?0, 'reponseChef': 'O', 'year': ?1 }")
    List<DemandeConge> findByServiceIdAndYearAndApproved(String serviceId, int year);

}
