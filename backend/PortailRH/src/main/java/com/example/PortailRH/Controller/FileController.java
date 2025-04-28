package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.Fichier_joint;
import com.example.PortailRH.Model.FileMetadataResponse;
import com.example.PortailRH.Service.FichierJointService;
import com.example.PortailRH.Util.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/files")
public class FileController {
    private static final Logger logger = LoggerFactory.getLogger(FileController.class);
    @Autowired
    private FichierJointService fichierJointService;

    @Autowired
    private JwtUtil jwtUtil;
    @GetMapping("/metadata/{fileId}")
    public ResponseEntity<?> getFileMetadata(
            @PathVariable String fileId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        logger.info("Requesting metadata for file ID: {}", fileId);

        // 1. Check Authorization
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            logger.warn("Unauthorized metadata access: Missing token");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }

        String token = authHeader.substring(7);
        if (!jwtUtil.validateToken(token)) {
            logger.warn("Invalid JWT token for metadata access");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
        }

        // 2. Retrieve metadata
        try {
            Optional<Fichier_joint> fileMetaOpt = fichierJointService.getFileMetadata(fileId);
            if (fileMetaOpt.isEmpty()) {
                logger.warn("No metadata found for file ID: {}", fileId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("File not found");
            }

            Fichier_joint meta = fileMetaOpt.get();

            // 3. Get resource to fetch size & contentType
            GridFsResource resource = fichierJointService.getFileResource(fileId);
            if (resource == null || !resource.exists()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Resource not found");
            }

            // 4. Prepare response payload
            return ResponseEntity.ok().body(new FileMetadataResponse(
                    fileId,
                    meta.getFilename(),
                    resource.contentLength(),
                    resource.getContentType(),
                    meta.getUploadDate() // Now this should work
            ));

        } catch (Exception e) {
            logger.error("Error getting metadata: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }


    @GetMapping("/{fileId}")
    public ResponseEntity<Resource> getFile(
            @PathVariable String fileId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        // Log incoming request for debugging
        logger.info("Received request for file ID: {}", fileId);

        // 1. Validate Authorization Header
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            logger.warn("Missing or invalid Authorization header");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(null);
        }

        // 2. Extract and Validate Token
        String token = authHeader.substring(7);
        try {
            if (!jwtUtil.validateToken(token)) {
                logger.warn("Invalid JWT token provided");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(null);
            }
        } catch (Exception e) {
            logger.error("Token validation error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(null);
        }

        // 3. Retrieve File
        try {
            GridFsResource resource = fichierJointService.getFileResource(fileId);
            if (resource == null || !resource.exists()) {
                logger.warn("File not found with ID: {}", fileId);
                return ResponseEntity.notFound().build();
            }

            // 4. Get Metadata
            Optional<Fichier_joint> metadata = fichierJointService.getFileMetadata(fileId);
            String filename = metadata.map(Fichier_joint::getFilename)
                    .orElse(resource.getFilename());

            // 5. Prepare Response
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION,
                    "inline; filename=\"" + filename + "\"");
            headers.add(HttpHeaders.CONTENT_TYPE, resource.getContentType());
            headers.add(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate");
            headers.add(HttpHeaders.PRAGMA, "no-cache");
            headers.add(HttpHeaders.EXPIRES, "0");

            logger.info("Successfully retrieved file: {}", filename);
            return ResponseEntity.ok()
                    .headers(headers)
                    .contentLength(resource.contentLength())
                    .body(resource);

        } catch (Exception e) {
            logger.error("Error retrieving file: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(null);
        }
    }

    @GetMapping("/download/{fileId}")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable String fileId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        // Same authentication check as above
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        String token = authHeader.substring(7);
        if (!jwtUtil.validateToken(token)) {
            return ResponseEntity.status(401).build();
        }

        try {
            GridFsResource resource = fichierJointService.getFileResource(fileId);

            if (resource == null) {
                return ResponseEntity.notFound().build();
            }

            Optional<Fichier_joint> metadata = fichierJointService.getFileMetadata(fileId);
            String filename = metadata.map(Fichier_joint::getFilename)
                    .orElse(resource.getFilename());

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType(resource.getContentType()))
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}