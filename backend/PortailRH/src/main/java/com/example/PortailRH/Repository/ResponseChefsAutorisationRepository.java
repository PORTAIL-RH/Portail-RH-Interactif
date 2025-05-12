package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.Response_chefs_dem_autorisation;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ResponseChefsAutorisationRepository extends MongoRepository<Response_chefs_dem_autorisation, String> {
    Optional<Response_chefs_dem_autorisation> findByDemandeId(String demandeId);
    List<Response_chefs_dem_autorisation> findByResponseChef1(String response);

}