package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.titre;
import com.example.PortailRH.Model.type;
import com.example.PortailRH.Repository.TitreRepository;
import com.example.PortailRH.Repository.TypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/titres")
public class titreController {

    @Autowired
    private TitreRepository titreRepository;

    @Autowired
    private TypeRepository typeRepository;

    /**
     * Récupère tous les titres.
     *
     * @return Liste des titres
     */
    @GetMapping("/")
    public List<titre> getAllTitres() {
        return titreRepository.findAll();
    }

    /**
     * Récupère un titre par son ID.
     *

     */
    @GetMapping("/{id}")
    public ResponseEntity<titre> getTitreById(@PathVariable String id) {
        Optional<titre> t = titreRepository.findById(id);
        if (t.isPresent()) {
            return new ResponseEntity<>(t.get(), HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    /**
     * Crée un nouveau titre avec ses types associés.
     *

     */
    @PostMapping("/create")
    public ResponseEntity<titre> createTitre(@RequestBody titre newTitre) {
        // Si des types sont inclus dans le titre, on vérifie leur existence dans la base
        if (newTitre.getTypes() != null) {
            for (type t : newTitre.getTypes()) {
                Optional<type> existingType = typeRepository.findById(t.getId());
                if (!existingType.isPresent()) {
                    return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
                }
            }
        }

        titre savedTitre = titreRepository.save(newTitre);
        return new ResponseEntity<>(savedTitre, HttpStatus.CREATED);
    }

    /**
      Met à jour un titre existant avec ses types associés.
     */
    @PutMapping("/{id}")
    public ResponseEntity<titre> updateTitre(@PathVariable String id, @RequestBody titre updatedTitre) {
        Optional<titre> existingTitre = titreRepository.findById(id);
        if (existingTitre.isPresent()) {
            updatedTitre.setId(id);  // Assurez-vous que l'ID ne soit pas modifié
            titre savedTitre = titreRepository.save(updatedTitre);
            return new ResponseEntity<>(savedTitre, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    /**
     * Supprime un titre.

     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTitre(@PathVariable String id) {
        Optional<titre> existingTitre = titreRepository.findById(id);
        if (existingTitre.isPresent()) {
            titreRepository.deleteById(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
}
