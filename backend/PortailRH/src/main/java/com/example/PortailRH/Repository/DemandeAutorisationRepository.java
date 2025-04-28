package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.DemandeAutorisation;
import com.example.PortailRH.Model.Reponse;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DemandeAutorisationRepository extends MongoRepository<DemandeAutorisation, String> {
    List<DemandeAutorisation> findByMatPers_Id(String matPersId);
    List<DemandeAutorisation> findByMatPersIdIn(List<String> personnelIds);
    List<DemandeAutorisation> findByReponseChef(Reponse reponse);

}
