package com.example.PortailRH.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
public class FileUploadController {

    private static final String UPLOAD_DIR = "assets/demandesdocuments";

    @PostMapping("/api/upload")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            // Ensure the upload directory exists
            File directory = new File(UPLOAD_DIR);
            if (!directory.exists()) {
                directory.mkdirs();
            }
            System.out.println("Upload directory: " + directory.getAbsolutePath());
            if (!directory.exists()) {
                boolean created = directory.mkdirs();
                System.out.println("Directory created: " + created);
            }

            // Generate a unique filename
            String originalFilename = file.getOriginalFilename();
            String uniqueFilename = UUID.randomUUID().toString() + "_" + originalFilename;

            // Save the file
            Path filePath = Paths.get(UPLOAD_DIR, uniqueFilename);
            Files.copy(file.getInputStream(), filePath);

            // Prepare the response
            Map<String, String> response = new HashMap<>();
            response.put("id", uniqueFilename);
            response.put("filePath", filePath.toString());
            response.put("filename", originalFilename);

            return ResponseEntity.ok(response);
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to upload file: " + e.getMessage()));
        }
    }
}