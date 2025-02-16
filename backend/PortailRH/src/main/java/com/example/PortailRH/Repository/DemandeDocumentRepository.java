package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.DemandeDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DemandeDocumentRepository extends MongoRepository<DemandeDocument, String> {
    List<DemandeDocument> findByMatPersId(String matPersId);
}
