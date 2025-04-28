package com.example.PortailRH.Model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;


@Data
@Document(collection = "Société")
public class Societe {

    @Id
    private String societeId;

    private String societeName;

    private String societeCodeSoc;

    private String emplacement;

    public String getSocieteId() {
        return societeId;
    }

    public void setSocieteId(String societeId) {
        this.societeId = societeId;
    }

    public String getSocieteName() {
        return societeName;
    }

    public void setSocieteName(String societeName) {
        this.societeName = societeName;
    }

    public String getSocieteCodeSoc() {
        return societeCodeSoc;
    }

    public void setSocieteCodeSoc(String societeCodeSoc) {
        this.societeCodeSoc = societeCodeSoc;
    }

    public String getEmplacement() {
        return emplacement;
    }

    public void setEmplacement(String emplacement) {
        this.emplacement = emplacement;
    }
}
