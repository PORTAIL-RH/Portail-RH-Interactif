package com.example.PortailRH.Model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "Themes")
@Data
public class theme {
    @Id
    private String id;
    private String theme;

    // Constructeurs, getters et setters
    public theme(String id, String theme) {
        this.id = id;
        this.theme = theme;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTheme() {
        return theme;
    }

    public void setTheme(String theme) {
        this.theme = theme;
    }
}
