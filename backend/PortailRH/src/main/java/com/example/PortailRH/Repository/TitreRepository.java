package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.titre;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface TitreRepository extends MongoRepository<titre, String> {
}
