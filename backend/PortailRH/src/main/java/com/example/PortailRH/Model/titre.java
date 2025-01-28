package com.example.PortailRH.Model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;
@Document(collection = "Titres")
@Data
public class titre {
    @Id
    private String id;
    private String titre;

    private List<type> types;  // Liste des types qui correspondent à ce titre

    // Getters et setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitre() {
        return titre;
    }

    public void setTitre(String titre) {
        this.titre = titre;
    }

    public List<type> getTypes() {
        return types;
    }

    public void setTypes(List<type> types) {
        this.types = types;
    }
}
