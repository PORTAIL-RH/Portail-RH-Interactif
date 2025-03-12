package com.example.PortailRH.Service;

import com.example.PortailRH.Model.Fichier_joint;
import com.example.PortailRH.Repository.FichierJointRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public class FichierJointService {

    @Autowired
    private FichierJointRepository fichierJointRepository;

    public Fichier_joint saveFile(MultipartFile file) throws IOException {
        Fichier_joint fichierJoint = new Fichier_joint();
        fichierJoint.setFilename(file.getOriginalFilename());
        fichierJoint.setFileType(file.getContentType());
        fichierJoint.setFilePath("assets\\demandesdocuments/" + file.getOriginalFilename()); // Set the file path
        return fichierJointRepository.save(fichierJoint); // Save the object and generate an ID
    }
}