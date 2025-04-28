package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.DemandeDocument;
import com.example.PortailRH.Model.DemandePreAvance;
import com.example.PortailRH.Model.Reponse;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DemandeDocumentRepository extends MongoRepository<DemandeDocument, String> {
    List<DemandeDocument> findByMatPersId(String matPersId);
    @Query("{ 'files.$id': ?0 }")
    List<DemandeDocument> findByFilesId(String fileId);

    // Find document requests containing a specific file in their FilesReponse collection
    @Query("{ 'filesReponse.$id': ?0 }")
    List<DemandeDocument> findByFilesReponseId(String fileId);
    List<DemandeDocument> findByMatPersIdIn(List<String> matPersIds);
    List<DemandeDocument> findByReponseChef(Reponse reponse);

}
