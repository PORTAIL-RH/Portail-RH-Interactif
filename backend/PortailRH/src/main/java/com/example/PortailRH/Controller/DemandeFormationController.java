package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.*;
import com.example.PortailRH.Repository.DemandeFormationRepository;
import com.example.PortailRH.Repository.ThemeRepository;
import com.example.PortailRH.Repository.TitreRepository;
import com.example.PortailRH.Repository.TypeRepository;
import com.example.PortailRH.Service.DemandeFormationService;
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

@RestController
@RequestMapping("/api/demande-formation")
public class DemandeFormationController {

    @Autowired
    private TitreRepository titreRepository;

    @Autowired
    private TypeRepository typeRepository;

    @Autowired
    private ThemeRepository themeRepository;

    @Autowired
    private DemandeFormationService demandeFormationService;

    @Autowired
    private FichierJointService fichierJointService;
    @Autowired
    private DemandeFormationRepository demandeFormationRepository;


    @GetMapping
    public ResponseEntity<List<DemandeFormation>> getAllDemandes() {
        List<DemandeFormation> demandes = demandeFormationRepository.findAll();
        return ResponseEntity.ok(demandes);
    }
    @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createDemandeFormation(
            @RequestParam("dateDebut") String dateDebut,
            @RequestParam("typeDemande") String typeDemande,
            @RequestParam("texteDemande") String texteDemande,
            @RequestParam("titre") String titreId,
            @RequestParam("type") String typeId,
            @RequestParam("theme") String themeId,
            @RequestParam("annee_f") String annee_f,
            @RequestParam("codeSoc") String codeSoc,
            @RequestParam("nbrJours") String nbrJours,

            @RequestParam(value = "file", required = false) MultipartFile file, // Fichier facultatif
            @RequestParam("matPersId") String matPersId) {

        try {
            // Validate and parse dates
            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
            Date startDate = dateFormat.parse(dateDebut);

            // Create the demande formation
            DemandeFormation demandeFormation = new DemandeFormation();
            demandeFormation.setDateDebut(startDate);
            demandeFormation.setTypeDemande(typeDemande);
            demandeFormation.setTexteDemande(texteDemande);
            demandeFormation.setCodeSoc(codeSoc);
            demandeFormation.setNbrJours(nbrJours);
            demandeFormation.setAnnee_f(annee_f);

            // Set the Personnel object based on matPersId
            Personnel matPers = new Personnel();
            matPers.setId(matPersId);
            demandeFormation.setMatPers(matPers);

            // Set the titre, type, and theme
            titre titre = titreRepository.findById(titreId)
                    .orElseThrow(() -> new RuntimeException("Titre non trouvé"));
            type type = typeRepository.findById(typeId)
                    .orElseThrow(() -> new RuntimeException("Type non trouvé"));
            theme theme = themeRepository.findById(themeId)
                    .orElseThrow(() -> new RuntimeException("Thème non trouvé"));

            demandeFormation.setTitre(titre);
            demandeFormation.setType(type);
            demandeFormation.setTheme(theme);

            // Handle the file upload only if a file is provided
            if (file != null && !file.isEmpty()) {
                Fichier_joint fichier = fichierJointService.saveFile(file);
                demandeFormation.getFiles().add(fichier);
            }

            // Save the request
            DemandeFormation createdDemande = demandeFormationService.createDemandeFormation(demandeFormation);
            return new ResponseEntity<>(createdDemande, HttpStatus.CREATED);

        } catch (ParseException e) {
            return new ResponseEntity<>("Format de date invalide.", HttpStatus.BAD_REQUEST);
        } catch (IOException e) {
            return new ResponseEntity<>("Erreur lors du traitement du fichier.", HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/personnel/{matPersId}")
    public ResponseEntity<List<DemandeFormation>> getDemandesFormationByPersonnelId(@PathVariable String matPersId) {
        List<DemandeFormation> demandes = demandeFormationRepository.findByMatPersId(matPersId);
        if (demandes.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(demandes);
    }
    @PutMapping("/valider/{id}")
    public ResponseEntity<String> validerDemande(@PathVariable String id) {
        return demandeFormationRepository.findById(id).map(demande -> {
            demande.setReponseChef(Reponse.O);
            demandeFormationRepository.save(demande);
            return ResponseEntity.ok("Demande validée avec succès");
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/refuser/{id}")
    public ResponseEntity<String> refuserDemande(@PathVariable String id) {
        return demandeFormationRepository.findById(id).map(demande -> {
            demande.setReponseChef(Reponse.N);
            demandeFormationRepository.save(demande);
            return ResponseEntity.ok("Demande refusée avec succès");
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/traiter/{id}")
    public ResponseEntity<String> traiterDemande(@PathVariable String id) {
        return demandeFormationRepository.findById(id).map(demande -> {
            demande.setReponseRH(Reponse.T);
            demandeFormationRepository.save(demande);
            return ResponseEntity.ok("Demande traitée avec succès");
        }).orElse(ResponseEntity.notFound().build());
    }
}