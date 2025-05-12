package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.Response_chefs_dem_conge;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ResponseChefsDemCongeRepository extends MongoRepository<Response_chefs_dem_conge, String> {
    Optional<Response_chefs_dem_conge> findByDemandeId(String demandeId);
    List<Response_chefs_dem_conge> findByResponseChef1(String response);

}