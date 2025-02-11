package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.DemandeAutorisation;
import com.example.PortailRH.Model.Fichier_joint;
import com.example.PortailRH.Model.Personnel;
import com.example.PortailRH.Repository.DemandeAutorisationRepository;
import com.example.PortailRH.Service.FichierJointService;
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

@RestController
@RequestMapping("/api/demande-autorisation")
public class DemandeAutorisationController {

    @Autowired
    private DemandeAutorisationRepository demandeAutorisationRepository;

    @Autowired
    private FichierJointService fichierJointService;

    @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createDemande(
            @RequestParam("dateDebut") String dateDebut,
            @RequestParam("dateFin") String dateFin,
            @RequestParam("texteDemande") String texteDemande,
            @RequestParam("heureSortie") String heureSortie,
            @RequestParam("heureRetour") String heureRetour,
            @RequestParam("codAutorisation") String codAutorisation,
            @RequestParam("codeSoc") String codeSoc,
            @RequestParam("file") MultipartFile file,
            @RequestParam("matPersId") String matPersId) {

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

            // Create the demande d'autorisation
            DemandeAutorisation demande = new DemandeAutorisation();
            demande.setDateDebut(startDate);
            demande.setDateFin(endDate);
            demande.setTypeDemande("autorisation"); // Automatically set typeDemande to "autorisation"
            demande.setTexteDemande(texteDemande);
            demande.setHeureSortie(new SimpleDateFormat("HH:mm").parse(heureSortie));
            demande.setHeureRetour(new SimpleDateFormat("HH:mm").parse(heureRetour));
            demande.setCodAutorisation(codAutorisation);
            demande.setCodeSoc(codeSoc);

            // Set the Personnel object based on matPersId
            Personnel matPers = new Personnel();
            matPers.setId(matPersId);  // You need to find this Personnel by ID if needed
            demande.setMatPers(matPers);

            // Associate the file with the request (if any)
            if (fichier != null) {
                demande.setFiles(List.of(fichier));
            }

            // Save the request
            demandeAutorisationRepository.save(demande);
            return new ResponseEntity<>("Demande d'autorisation créée avec succès", HttpStatus.CREATED);

        } catch (ParseException e) {
            return new ResponseEntity<>("Format de date ou heure invalide.", HttpStatus.BAD_REQUEST);
        } catch (IOException e) {
            return new ResponseEntity<>("Erreur lors du traitement du fichier.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Endpoint pour récupérer toutes les demandes d'autorisation
    @GetMapping
    public ResponseEntity<List<DemandeAutorisation>> getAllDemandes() {
        List<DemandeAutorisation> demandes = demandeAutorisationRepository.findAll();
        return ResponseEntity.ok(demandes);
    }

    // Endpoint pour récupérer une demande par son ID
    @GetMapping("/{id}")
    public ResponseEntity<DemandeAutorisation> getDemandeById(@PathVariable String id) {
        Optional<DemandeAutorisation> demande = demandeAutorisationRepository.findById(id);
        return demande.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Endpoint pour mettre à jour une demande d'autorisation
    @PutMapping("/{id}")
    public ResponseEntity<DemandeAutorisation> updateDemande(@PathVariable String id, @RequestBody DemandeAutorisation demandeAutorisation) {
        if (demandeAutorisationRepository.existsById(id)) {
            demandeAutorisation.setId_libre_demande(id);
            DemandeAutorisation updatedDemande = demandeAutorisationRepository.save(demandeAutorisation);
            return ResponseEntity.ok(updatedDemande);
        }
        return ResponseEntity.notFound().build();
    }

    // Endpoint pour supprimer une demande d'autorisation
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDemande(@PathVariable String id) {
        if (demandeAutorisationRepository.existsById(id)) {
            demandeAutorisationRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/personnel/{matPersId}")
    public ResponseEntity<List<DemandeAutorisation>> getDemandesByPersonnelId(@PathVariable String matPersId) {
        // Find all demands where the matPers.id matches the provided matPersId
        List<DemandeAutorisation> demandes = demandeAutorisationRepository.findByMatPersId(matPersId);

        if (demandes.isEmpty()) {
            return ResponseEntity.noContent().build(); // Return 204 No Content if no demands are found
        }

        return ResponseEntity.ok(demandes); // Return the list of demands
    }

}