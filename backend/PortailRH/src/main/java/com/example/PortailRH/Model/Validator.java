package com.example.PortailRH.Model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "Validators")
public class Validator {
    @Id
    private String id;

    @DBRef
    private Service service;

    @DBRef
    private Personnel chef;

    private int poid;

    // No-args constructor
    public Validator() {}

    // All-args constructor
    public Validator(Service service, Personnel chef, int poid) {
        this.service = service;
        this.chef = chef;
        this.poid = poid;
    }



    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Service getService() { return service; }
    public void setService(Service service) { this.service = service; }
    public Personnel getChef() { return chef; }
    public void setChef(Personnel chef) { this.chef = chef; }
    public int getPoid() { return poid; }
    public void setPoid(int poid) { this.poid = poid; }
}