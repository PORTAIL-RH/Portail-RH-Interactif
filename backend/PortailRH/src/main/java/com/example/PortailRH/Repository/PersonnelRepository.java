package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.Personnel;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
@Repository

public interface PersonnelRepository extends MongoRepository<Personnel, String> {
    Optional<Personnel> findByMatricule(String code);
    Optional<Personnel> findByEmail(String email);
}
