package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.Service;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ServiceRepository extends MongoRepository<Service, String> {
    Service findByServiceName(String serviceName);
}