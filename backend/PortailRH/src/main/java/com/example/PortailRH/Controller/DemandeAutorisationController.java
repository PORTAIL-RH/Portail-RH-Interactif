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

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
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
            @RequestParam("heureSortie") String heureSortieStr,
            @RequestParam("heureRetour") String heureRetourStr,
            @RequestParam("codAutorisation") String codAutorisation,
            @RequestParam("codeSoc") String codeSoc,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam("matPersId") String matPersId) {

        try {
            // Convertir les dates en objets Date
            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
            Date startDate = dateFormat.parse(dateDebut);
            Date endDate = dateFormat.parse(dateFin);

            if (startDate.after(endDate)) {
                return ResponseEntity.badRequest().body("La date de début doit être avant la date de fin.");
            }

            // Convertir les heures en LocalTime
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
            LocalTime heureSortie = LocalTime.parse(heureSortieStr, timeFormatter);
            LocalTime heureRetour = LocalTime.parse(heureRetourStr, timeFormatter);

// Vérifier si l'heure de sortie est après l'heure de retour
            if (heureSortie.isAfter(heureRetour)) {
                return ResponseEntity.badRequest().body("L'heure de sortie doit être avant l'heure de retour.");
            }

// Extraire l'heure et les minutes
            int horaireSortie = heureSortie.getHour();
            int minuteSortie = heureSortie.getMinute();
            int horaireRetour = heureRetour.getHour();
            int minuteRetour = heureRetour.getMinute();

// Créer une nouvelle demande d'autorisation
            DemandeAutorisation demande = new DemandeAutorisation();
            demande.setDateDebut(startDate);
            demande.setDateFin(endDate);
            demande.setTypeDemande("autorisation");
            demande.setTexteDemande(texteDemande);
            demande.setHoraireSortie(horaireSortie);
            demande.setMinuteSortie(minuteSortie);
            demande.setHoraireRetour(horaireRetour);
            demande.setMinuteRetour(minuteRetour);

// Ajouter ces lignes pour corriger le problème :
            demande.setHeureSortie(horaireSortie);  // Fixer l'heureSortie avec la valeur correcte
            demande.setHeureRetour(horaireRetour);  // Fixer l'heureRetour avec la valeur correcte

            demande.setCodAutorisation(codAutorisation);
            demande.setCodeSoc(codeSoc);

// Associer le personnel
            Personnel personnel = new Personnel();
            personnel.setId(matPersId);
            demande.setMatPers(personnel);

// Gérer l'upload du fichier s'il existe
            if (file != null && !file.isEmpty()) {
                Fichier_joint fichier = fichierJointService.saveFile(file);
                demande.setFiles(List.of(fichier));
            }

// Enregistrer la demande
            demandeAutorisationRepository.save(demande);
            return ResponseEntity.status(HttpStatus.CREATED).body("Demande d'autorisation créée avec succès");


        } catch (ParseException e) {
            return ResponseEntity.badRequest().body("Format de date invalide.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Une erreur est survenue : " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<DemandeAutorisation>> getAllDemandes() {
        List<DemandeAutorisation> demandes = demandeAutorisationRepository.findAll();
        return ResponseEntity.ok(demandes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DemandeAutorisation> getDemandeById(@PathVariable String id) {
        Optional<DemandeAutorisation> demande = demandeAutorisationRepository.findById(id);
        return demande.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDemande(@PathVariable String id, @RequestBody DemandeAutorisation demandeAutorisation) {
        if (!demandeAutorisationRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        demandeAutorisation.setId(id);
        demandeAutorisationRepository.save(demandeAutorisation);
        return ResponseEntity.ok("Demande mise à jour avec succès");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDemande(@PathVariable String id) {
        if (!demandeAutorisationRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        demandeAutorisationRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/personnel/{matPersId}")
    public ResponseEntity<List<DemandeAutorisation>> getDemandesByPersonnelId(@PathVariable String matPersId) {
        List<DemandeAutorisation> demandes = demandeAutorisationRepository.findByMatPers_Id(matPersId);
        return demandes.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(demandes);
    }
}