package com.example.PortailRH.Model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;
@Document(collection = "Types")
@Data
public class type {
    @Id
    private String id;
    private String type;
    private List<theme> themes;  // Liste des thèmes qui correspondent à ce type

    // Constructeurs, getters et setters
    public type(String id, String type) {
        this.id = id;
        this.type = type;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public List<theme> getThemes() {
        return themes;
    }

    public void setThemes(List<theme> themes) {
        this.themes = themes;
    }
}
