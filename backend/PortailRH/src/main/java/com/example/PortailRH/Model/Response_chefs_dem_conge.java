package com.example.PortailRH.Model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Document("Response_chefs_dem_conge")

public class Response_chefs_dem_conge {
    @Id
    @Field("id_libre_demande")
    private String id;
    private String demandeId;

    public String getDemandeId() {
        return demandeId;
    }

    public void setDemandeId(String demandeId) {
        this.demandeId = demandeId;
    }

    // Chef 1
    private String responseChef1;
    private String observationChef1;
    private String dateChef1;

    // Chef 2
    private String responseChef2;
    private String observationChef2;
    private String dateChef2;

    // Chef 3
    private String responseChef3;
    private String observationChef3;
    private String dateChef3;

    public Response_chefs_dem_conge() {
    }

    public Response_chefs_dem_conge(String responseChef1, String observationChef1, String dateChef1,
                                    String responseChef2, String observationChef2, String dateChef2,
                                    String responseChef3, String observationChef3, String dateChef3) {
        this.responseChef1 = responseChef1;
        this.observationChef1 = observationChef1;
        this.dateChef1 = dateChef1;

        this.responseChef2 = responseChef2;
        this.observationChef2 = observationChef2;
        this.dateChef2 = dateChef2;

        this.responseChef3 = responseChef3;
        this.observationChef3 = observationChef3;
        this.dateChef3 = dateChef3;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getResponseChef1() {
        return responseChef1;
    }

    public void setResponseChef1(String responseChef1) {
        this.responseChef1 = responseChef1;
    }

    public String getObservationChef1() {
        return observationChef1;
    }

    public void setObservationChef1(String observationChef1) {
        this.observationChef1 = observationChef1;
    }


    public String getDateChef1() {
        return dateChef1;
    }

    public void setDateChef1(String dateChef1) {
        this.dateChef1 = dateChef1;
    }

    public String getResponseChef2() {
        return responseChef2;
    }

    public void setResponseChef2(String responseChef2) {
        this.responseChef2 = responseChef2;
    }

    public String getObservationChef2() {
        return observationChef2;
    }

    public void setObservationChef2(String observationChef2) {
        this.observationChef2 = observationChef2;
    }

    public String getDateChef2() {
        return dateChef2;
    }

    public void setDateChef2(String dateChef2) {
        this.dateChef2 = dateChef2;
    }

    public String getResponseChef3() {
        return responseChef3;
    }

    public void setResponseChef3(String responseChef3) {
        this.responseChef3 = responseChef3;
    }

    public String getObservationChef3() {
        return observationChef3;
    }

    public void setObservationChef3(String observationChef3) {
        this.observationChef3 = observationChef3;
    }

    public String getDateChef3() {
        return dateChef3;
    }

    public void setDateChef3(String dateChef3) {
        this.dateChef3 = dateChef3;
    }

}
