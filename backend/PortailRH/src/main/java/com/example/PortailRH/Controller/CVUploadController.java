package com.example.PortailRH.Controller;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
public class CVUploadController {

    private static final String UPLOAD_DIR = "assets/CVS";

    @PostMapping("/cv")
    public ResponseEntity<Map<String, String>> uploadCV(@RequestParam("file") MultipartFile file) {
        try {
            // Ensure the upload directory exists
            File directory = new File(UPLOAD_DIR);
            if (!directory.exists()) {
                directory.mkdirs();
            }

            // Generate a unique filename
            String originalFilename = file.getOriginalFilename();
            String uniqueFilename = UUID.randomUUID().toString() + "_" + originalFilename;

            // Save the file
            Path filePath = Paths.get(UPLOAD_DIR, uniqueFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

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

    @GetMapping("/cv/{id}")
    public ResponseEntity<Resource> getFileById(@PathVariable String id) {
        try {
            // Construct the file path
            Path filePath = Paths.get(UPLOAD_DIR).resolve(id).normalize();

            // Check if the file exists
            if (!Files.exists(filePath)) {
                return ResponseEntity.status(404).body(null);
            }

            // Load the file as a Resource
            Resource resource = new UrlResource(filePath.toUri());

            // Determine the file's content type
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream"; // Default content type
            }

            // Return the file in the response
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(null);
        }
    }
}