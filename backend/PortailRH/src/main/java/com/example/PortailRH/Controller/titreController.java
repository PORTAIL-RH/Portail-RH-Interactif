package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.theme;
import com.example.PortailRH.Model.titre;
import com.example.PortailRH.Model.type;
import com.example.PortailRH.Repository.AdminUserRepository;
import com.example.PortailRH.Repository.ThemeRepository;
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
    @Autowired
    private ThemeRepository themeRepository;



    /**
     * Get all titres.
     *
     * @return List of titres
     */
    @GetMapping("/")
    public ResponseEntity<List<titre>> getAllTitres() {
        List<titre> titres = titreRepository.findAll();
        return new ResponseEntity<>(titres, HttpStatus.OK);
    }

    /**
     * Get a titre by ID.
     *
     * @param id The ID of the titre
     * @return The titre object if found, or 404 NOT FOUND
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
        // Check and create missing types
        if (newTitre.getTypes() != null) {
            for (type t : newTitre.getTypes()) {
                Optional<type> existingType = typeRepository.findById(t.getId());
                if (!existingType.isPresent()) {
                    // If the type doesn't exist, save it to the repository
                    typeRepository.save(t);
                }
                // Check and create themes if they don't exist
                if (t.getThemes() != null) {
                    for (theme th : t.getThemes()) {
                        AdminUserRepository ThemeRepository;
                        Optional<theme> existingTheme = themeRepository.findById(th.getId());
                        if (!existingTheme.isPresent()) {
                            themeRepository.save(th);
                        }
                    }
                }
            }
        }

        // Save the new titre with the types and themes
        titre savedTitre = titreRepository.save(newTitre);
        return new ResponseEntity<>(savedTitre, HttpStatus.CREATED);
    }
    /**
     * Get types associated with a titre.
     *
     * @param id The ID of the titre
     * @return List of types
     */
    @GetMapping("/{id}/types")
    public ResponseEntity<List<type>> getTypesByTitreId(@PathVariable String id) {
        Optional<titre> t = titreRepository.findById(id);
        if (t.isPresent()) {
            return new ResponseEntity<>(t.get().getTypes(), HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    /**
     * Get themes for a specific type in a titre.
     *
     * @param titreId The ID of the titre
     * @param typeId  The ID of the type
     * @return List of themes
     */
    @GetMapping("/{titreId}/types/{typeId}/themes")
    public ResponseEntity<List<theme>> getThemesByTitreAndType(@PathVariable String titreId, @PathVariable String typeId) {
        Optional<titre> t = titreRepository.findById(titreId);
        if (t.isPresent()) {
            Optional<type> ty = t.get().getTypes().stream()
                    .filter(tp -> tp.getId().equals(typeId))
                    .findFirst();
            if (ty.isPresent()) {
                return new ResponseEntity<>(ty.get().getThemes(), HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
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
