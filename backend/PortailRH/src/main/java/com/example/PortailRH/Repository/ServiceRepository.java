package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.Service;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface ServiceRepository extends MongoRepository<Service, String> {
    Service findByServiceName(String serviceName);


    @Query("{ '$or': [ { 'chef1.$id': ?0 }, { 'chef2.$id': ?1 }, { 'chef3.$id': ?2 } ] }")
    List<Service> findByChef1IdOrChef2IdOrChef3Id(String chef1Id, String chef2Id, String chef3Id);

}