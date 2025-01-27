package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.theme;
import com.example.PortailRH.Repository.ThemeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/themes")
public class themeController {

    @Autowired
    private ThemeRepository themeRepository;

    @GetMapping("/")
    public List<theme> getAllThemes() {
        return themeRepository.findAll();
    }


    @GetMapping("/{id}")
    public ResponseEntity<theme> getThemeById(@PathVariable String id) {
        Optional<theme> t = themeRepository.findById(id);
        if (t.isPresent()) {
            return new ResponseEntity<>(t.get(), HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping("/create")
    public ResponseEntity<theme> createTheme(@RequestBody theme newTheme) {
        theme savedTheme = themeRepository.save(newTheme);
        return new ResponseEntity<>(savedTheme, HttpStatus.CREATED);
    }


    @PutMapping("/{id}")
    public ResponseEntity<theme> updateTheme(@PathVariable String id, @RequestBody theme updatedTheme) {
        Optional<theme> existingTheme = themeRepository.findById(id);
        if (existingTheme.isPresent()) {
            updatedTheme.setId(id);  // Assurez-vous que l'ID ne soit pas modifié
            theme savedTheme = themeRepository.save(updatedTheme);
            return new ResponseEntity<>(savedTheme, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTheme(@PathVariable String id) {
        Optional<theme> existingTheme = themeRepository.findById(id);
        if (existingTheme.isPresent()) {
            themeRepository.deleteById(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
}
