package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.DemandeFormation;
import com.example.PortailRH.Model.theme;
import com.example.PortailRH.Model.titre;
import com.example.PortailRH.Model.type;
import com.example.PortailRH.Repository.ThemeRepository;
import com.example.PortailRH.Repository.TitreRepository;
import com.example.PortailRH.Repository.TypeRepository;
import com.example.PortailRH.Service.DemandeFormationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

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

    /**
     * Récupère les types associés à un titre.
     *
     * @param titreId L'ID du titre
     * @return Liste des types associés
     */
    @GetMapping("/types/{titreId}")
    public List<type> getTypesForTitre(@PathVariable String titreId) {
        titre titre = titreRepository.findById(titreId).orElse(null);
        if (titre != null) {
            return titre.getTypes();  // Retourne les types associés à ce titre
        }
        return null;
    }

    /**
     * Récupère les thèmes associés à un type.
     *
     * @param typeId L'ID du type
     * @return Liste des thèmes associés
     */
    @GetMapping("/themes/{typeId}")
    public List<theme> getThemesForType(@PathVariable String typeId) {
        type type = typeRepository.findById(typeId).orElse(null);
        if (type != null) {
            return type.getThemes();  // Retourne les thèmes associés à ce type
        }
        return null;
    }

    /**
     * Récupère tous les titres disponibles.
     *
     * @return Liste des titres disponibles
     */
    @GetMapping("/titres")
    public List<titre> getAllTitres() {
        return titreRepository.findAll();
    }

    /**
     * Crée une nouvelle demande de formation.
     *
     * @param demandeFormation Les données de la demande de formation
     * @return La demande de formation créée
     */
    @PostMapping("/create")
    public DemandeFormation createDemandeFormation(@RequestBody DemandeFormation demandeFormation) {
        // Validation des données
        if (demandeFormation.getMatPers() == null || demandeFormation.getCodeSoc() == null) {
            throw new IllegalArgumentException("Les informations nécessaires sont manquantes.");
        }

        // Appel au service pour enregistrer la demande de formation
        DemandeFormation createdDemande = demandeFormationService.createDemandeFormation(demandeFormation);

        return createdDemande;
    }
}
