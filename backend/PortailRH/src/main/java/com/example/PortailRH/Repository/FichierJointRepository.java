package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.Fichier_joint;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository

public interface FichierJointRepository extends MongoRepository<Fichier_joint, String> {

}
