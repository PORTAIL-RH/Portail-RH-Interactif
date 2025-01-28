package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.type;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface TypeRepository extends MongoRepository<type, String> {
}
