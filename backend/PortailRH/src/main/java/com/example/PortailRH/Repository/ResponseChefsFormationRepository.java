package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.Response_chefs_dem_formation;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;


public interface ResponseChefsFormationRepository extends MongoRepository<Response_chefs_dem_formation, String> {
    // Custom methods if needed
    Optional<Response_chefs_dem_formation> findByDemandeId(String demandeId);
    List<Response_chefs_dem_formation> findByResponseChef1(String response);

}
