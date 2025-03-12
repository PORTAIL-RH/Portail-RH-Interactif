package com.example.PortailRH.Service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FileStorageService {
    // Define the directory where files will be saved
    private final Path rootLocation = Paths.get("/assets/demandesdocuments");

    // Save a file to the directory
    public String storeFile(MultipartFile file) throws IOException {
        // Ensure the directory exists
        if (!Files.exists(rootLocation)) {
            Files.createDirectories(rootLocation);
        }

        // Generate a unique file name
        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();

        // Save the file
        Path destinationFile = rootLocation.resolve(fileName);
        Files.copy(file.getInputStream(), destinationFile);

        // Return the file path
        return destinationFile.toString();
    }
}