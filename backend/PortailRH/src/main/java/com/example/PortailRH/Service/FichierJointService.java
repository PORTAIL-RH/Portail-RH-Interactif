package com.example.PortailRH.Service;

import com.example.PortailRH.Model.Fichier_joint;
import com.example.PortailRH.Repository.FichierJointRepository;
import com.mongodb.client.gridfs.model.GridFSFile;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsOperations;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Optional;

@Service
public class FichierJointService {

    @Autowired
    private GridFsTemplate gridFsTemplate;

    @Autowired
    private GridFsOperations gridFsOperations;

    @Autowired
    private FichierJointRepository fichierJointRepository;

    // Method to save a file
    public Fichier_joint saveFile(MultipartFile file) throws IOException {
        ObjectId fileId = gridFsTemplate.store(
                file.getInputStream(),
                file.getOriginalFilename(),
                file.getContentType()
        );

        Fichier_joint fichier = new Fichier_joint();
        fichier.setFilename(file.getOriginalFilename());
        fichier.setFileType(file.getContentType());
        fichier.setFileId(fileId.toString());

        return fichierJointRepository.save(fichier);
    }

    // Method to get file metadata (replaces getFile)
    public Optional<Fichier_joint> getFileMetadata(String id) {
        return fichierJointRepository.findById(id);
    }

    // Method to get GridFS file (replaces getFile)
    public GridFSFile getGridFSFile(String fileId) {
        return gridFsTemplate.findOne(new Query(Criteria.where("_id").is(new ObjectId(fileId))));
    }

    // Method to get file resource (replaces getGridFsResource)
    public GridFsResource getFileResource(String fileId) {
        GridFSFile file = getGridFSFile(fileId);
        return file != null ? gridFsOperations.getResource(file) : null;
    }

    // Method to delete a file
    public void deleteFile(String id) {
        Optional<Fichier_joint> fichier = fichierJointRepository.findById(id);
        if (fichier.isPresent()) {
            gridFsTemplate.delete(new Query(Criteria.where("_id").is(new ObjectId(fichier.get().getFileId()))));
            fichierJointRepository.deleteById(id);
        }
    }
}
