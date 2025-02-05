package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.DemandeConge;
import com.example.PortailRH.Model.Fichier_joint;
import com.example.PortailRH.Model.Personnel;
import com.example.PortailRH.Service.FichierJointService;
import com.example.PortailRH.Repository.DemandeCongeRepository;
import com.example.PortailRH.Repository.FichierJointRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/demande-conge")
public class DemandeCongeController {

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
    public ResponseEntity<String> createDemandeConge(
            @RequestParam("dateDebut") String dateDebut,
            @RequestParam("dateFin") String dateFin,
            @RequestParam("texteDemande") String texteDemande,
            @RequestParam("snjTempDep") String snjTempDep,
            @RequestParam("snjTempRetour") String snjTempRetour,
            @RequestParam("dateReprisePrev") String dateReprisePrev,
            @RequestParam("codeSoc") String codeSoc,
            @RequestParam("file") MultipartFile file,
            @RequestParam("matPersId") String matPersId,
            @RequestParam("nbrJours") String nbrJours) {

        try {
            // Validate and parse dates
            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
            Date startDate = dateFormat.parse(dateDebut);
            Date endDate = dateFormat.parse(dateFin);

            if (startDate.after(endDate)) {
                return new ResponseEntity<>("La date de début doit être avant la date de fin.", HttpStatus.BAD_REQUEST);
            }

            // Handle the file upload
            Fichier_joint fichier = fichierJointService.saveFile(file);

            // Validate and parse the number of days
            int days;
            try {
                days = Integer.parseInt(nbrJours);
            } catch (NumberFormatException e) {
                return new ResponseEntity<>("Le nombre de jours n'est pas valide.", HttpStatus.BAD_REQUEST);
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
            demande.setDateReprisePrev(dateReprise);
            demande.setTypeDemande("congé"); // Définition automatique du type

            // Set the Personnel object based on matPersId and codeSoc
            Personnel matPers = new Personnel();
            matPers.setId(matPersId);
            matPers.setCode_soc(codeSoc);
            demande.setMatPers(matPers);

            demande.setNbrJours(days);

            // Associate the file with the request (if any)
            if (fichier != null) {
                demande.setFiles(List.of(fichier));
            }

            // Save the request
            demandeCongeRepository.save(demande);
            return new ResponseEntity<>("Demande de congé créée avec succès", HttpStatus.CREATED);

        } catch (ParseException e) {
            return new ResponseEntity<>("Format de date invalide. Utilisez le format yyyy-MM-dd.", HttpStatus.BAD_REQUEST);
        } catch (IOException e) {
            throw new RuntimeException(e);
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

            // Save and return the updated demande
            demandeCongeRepository.save(existingDemande);
            return ResponseEntity.ok("Demande mise à jour avec succès");
        }).orElse(ResponseEntity.notFound().build());
    }
}
