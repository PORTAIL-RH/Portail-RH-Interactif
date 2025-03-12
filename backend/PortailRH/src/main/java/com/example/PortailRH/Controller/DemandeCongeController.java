package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.DemandeConge;
import com.example.PortailRH.Model.Fichier_joint;
import com.example.PortailRH.Model.Personnel;
import com.example.PortailRH.Model.Reponse;
import com.example.PortailRH.Service.FichierJointService;
import com.example.PortailRH.Repository.DemandeCongeRepository;
import com.example.PortailRH.Repository.FichierJointRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.TimeUnit;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/demande-conge")
public class DemandeCongeController {
    @Autowired
    private SseController sseController; // Autowire the SseController instance

    @Autowired
    private DemandeCongeRepository demandeCongeRepository;

    @Autowired
    private FichierJointRepository fichierJointRepository;

    @Autowired
    private FichierJointService fichierJointService;

    // 1. Get all demands
    @GetMapping
    public List<DemandeConge> getAllDemandes() {
        return demandeCongeRepository.findAll();
    }

    // 2. Get a demand by ID
    @GetMapping("/{id}")
    public ResponseEntity<DemandeConge> getDemandeById(@PathVariable String id) {
        Optional<DemandeConge> demande = demandeCongeRepository.findById(id);
        return demande.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    // 3. Create a new demand
    @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> createDemandeConge(
            @RequestParam("dateDebut") String dateDebut,
            @RequestParam("dateFin") String dateFin,
            @RequestParam("texteDemande") String texteDemande,
            @RequestParam("snjTempDep") String snjTempDep,
            @RequestParam("snjTempRetour") String snjTempRetour,
            @RequestParam("codeSoc") String codeSoc,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam("matPersId") String matPersId,
            @RequestParam("nbrJours") String nbrJours) {

        try {
            // Validate and parse dates
            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
            Date startDate = dateFormat.parse(dateDebut);
            Date endDate = dateFormat.parse(dateFin);

            if (startDate.after(endDate)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "La date de début doit être avant la date de fin."
                ));
            }

            // Handle the file upload (if any)
            Fichier_joint fichier = null;
            if (file != null && !file.isEmpty()) {
                fichier = fichierJointService.saveFile(file);
            }

            // Validate and parse the number of days
            int days;
            try {
                days = Integer.parseInt(nbrJours);
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Le nombre de jours n'est pas valide."
                ));
            }

            // Calculate the reprise date based on the nbrJours
            Date dateReprise = new Date(endDate.getTime() + TimeUnit.DAYS.toMillis(days));

            // Create the demande de congé
            DemandeConge demande = new DemandeConge();
            demande.setDateDebut(startDate);
            demande.setDateFin(endDate);
            demande.setTexteDemande(texteDemande);
            demande.setSnjTempDep(snjTempDep);
            demande.setSnjTempRetour(snjTempRetour);
            demande.setTypeDemande("congé");

            // Set the Personnel object based on matPersId and codeSoc
            Personnel matPers = new Personnel();
            matPers.setId(matPersId);
            matPers.setCode_soc(codeSoc);
            demande.setMatPers(matPers);
            demande.setCodeSoc(codeSoc);

            demande.setNbrJours(days);

            // Associate the file with the request (if any)
            if (fichier != null) {
                demande.setFiles(List.of(fichier));
            }

            // Save the request
            DemandeConge savedDemande = demandeCongeRepository.save(demande);

            // Notify all connected clients
            sseController.sendUpdate("created", savedDemande);

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Demande de congé créée avec succès",
                    "demandeId", savedDemande.getId()
            ));

        } catch (ParseException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Format de date invalide. Utilisez le format yyyy-MM-dd."
            ));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "message", "Erreur lors du traitement du fichier."
            ));
        }

    }
    // 4. Update a demand
    @PutMapping("/{id}")
    public ResponseEntity<?> updateDemande(
            @PathVariable String id,
            @RequestBody DemandeConge demandeUpdated
    ) {
        return demandeCongeRepository.findById(id).map(existingDemande -> {
            existingDemande.setDateDebut(demandeUpdated.getDateDebut());
            existingDemande.setDateFin(demandeUpdated.getDateFin());
            existingDemande.setTypeDemande(demandeUpdated.getTypeDemande());
            existingDemande.setTexteDemande(demandeUpdated.getTexteDemande());
            existingDemande.setReponseChef(demandeUpdated.getReponseChef());
            existingDemande.setReponseRH(demandeUpdated.getReponseRH());

            // Save the updated demande
            DemandeConge updatedDemande = demandeCongeRepository.save(existingDemande);

            // Notify all connected clients
            sseController.sendUpdate("updated", updatedDemande);

            return ResponseEntity.ok("Demande mise à jour avec succès");
        }).orElse(ResponseEntity.notFound().build());
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteDemande(@PathVariable String id) {
        return demandeCongeRepository.findById(id).map(demande -> {
            // Notify all connected clients before deleting
            sseController.sendUpdate("deleted", demande);

            // Delete the demande
            demandeCongeRepository.delete(demande);

            return ResponseEntity.ok("Demande supprimée avec succès");
        }).orElse(ResponseEntity.notFound().build());
    }
    @GetMapping("/personnel/{matPersId}")
    public ResponseEntity<List<DemandeConge>> getDemandesByPersonnelId(@PathVariable String matPersId) {
        List<DemandeConge> demandes = demandeCongeRepository.findByMatPersId(matPersId);
        if (demandes.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(demandes);
    }



    @PutMapping("/valider/{id}")
    public ResponseEntity<String> validerDemande(@PathVariable String id) {
        return demandeCongeRepository.findById(id).map(demande -> {
            demande.setReponseChef(Reponse.O);
            demandeCongeRepository.save(demande);
            return ResponseEntity.ok("Demande validée avec succès");
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/refuser/{id}")
    public ResponseEntity<String> refuserDemande(@PathVariable String id) {
        return demandeCongeRepository.findById(id).map(demande -> {
            demande.setReponseChef(Reponse.N);
            demandeCongeRepository.save(demande);
            return ResponseEntity.ok("Demande refusée avec succès");
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/traiter/{id}")
    public ResponseEntity<String> traiterDemande(@PathVariable String id) {
        return demandeCongeRepository.findById(id).map(demande -> {
            demande.setReponseRH(Reponse.T);
            demandeCongeRepository.save(demande);
            return ResponseEntity.ok("Demande traitée avec succès");
        }).orElse(ResponseEntity.notFound().build());
    }
    @GetMapping("/approved")
    public ResponseEntity<List<Map<String, Object>>> getApprovedDemandes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<DemandeConge> approvedDemandes = demandeCongeRepository.findByReponseChef(Reponse.O, pageable);

        List<Map<String, Object>> result = approvedDemandes.stream()
                .map(demande -> {
                    Map<String, Object> dateMap = new HashMap<>();
                    dateMap.put("dateDebut", demande.getDateDebut());
                    dateMap.put("dateFin", demande.getDateFin());
                    dateMap.put("employee", demande.getMatPers());
                    return dateMap;
                })
                .toList();

        return ResponseEntity.ok(result);
    }
}