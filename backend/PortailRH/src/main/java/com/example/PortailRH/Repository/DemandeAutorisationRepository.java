package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.DemandeAutorisation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DemandeAutorisationRepository extends MongoRepository<DemandeAutorisation, String> {
    // Vous pouvez ajouter des méthodes personnalisées si nécessaire
}
