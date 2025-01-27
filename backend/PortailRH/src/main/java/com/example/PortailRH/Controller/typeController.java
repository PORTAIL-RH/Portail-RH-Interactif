package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.type;
import com.example.PortailRH.Model.theme;
import com.example.PortailRH.Repository.TypeRepository;
import com.example.PortailRH.Repository.ThemeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/types")
public class typeController {

    @Autowired
    private TypeRepository typeRepository;

    @Autowired
    private ThemeRepository themeRepository;

    /**
     * Récupère tous les types.
     *
     * @return Liste des types
     */
    @GetMapping("/")
    public List<type> getAllTypes() {
        return typeRepository.findAll();
    }

    /**
     * Récupère un type par son ID.
     *
     * @param id L'ID du type
     * @return Le type trouvé ou une erreur si non trouvé
     */
    @GetMapping("/{id}")
    public ResponseEntity<type> getTypeById(@PathVariable String id) {
        Optional<type> t = typeRepository.findById(id);
        if (t.isPresent()) {
            return new ResponseEntity<>(t.get(), HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    /**
     * Crée un nouveau type avec ses thèmes associés.
     *
     * @param newType Le type à créer
     * @return Le type créé
     */
    @PostMapping("/create")
    public ResponseEntity<type> createType(@RequestBody type newType) {
        // Si des thèmes sont inclus dans le type, on vérifie leur existence dans la base
        if (newType.getThemes() != null) {
            for (theme t : newType.getThemes()) {
                Optional<theme> existingTheme = themeRepository.findById(t.getId());
                if (!existingTheme.isPresent()) {
                    return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
                }
            }
        }

        type savedType = typeRepository.save(newType);
        return new ResponseEntity<>(savedType, HttpStatus.CREATED);
    }

    /**
     * Met à jour un type existant avec ses thèmes associés.
     *
     * @param id      L'ID du type à mettre à jour
     * @param updatedType L'objet type mis à jour
     * @return Le type mis à jour ou une erreur si non trouvé
     */
    @PutMapping("/{id}")
    public ResponseEntity<type> updateType(@PathVariable String id, @RequestBody type updatedType) {
        Optional<type> existingType = typeRepository.findById(id);
        if (existingType.isPresent()) {
            updatedType.setId(id);  // Assurez-vous que l'ID ne soit pas modifié
            type savedType = typeRepository.save(updatedType);
            return new ResponseEntity<>(savedType, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    /**
     * Supprime un type.
     *
     * @param id L'ID du type à supprimer
     * @return Statut de la suppression
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteType(@PathVariable String id) {
        Optional<type> existingType = typeRepository.findById(id);
        if (existingType.isPresent()) {
            typeRepository.deleteById(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
}
