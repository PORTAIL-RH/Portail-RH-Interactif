package com.example.PortailRH.Model;

import com.example.PortailRH.Config.PersonnelReferenceSerializer;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.List;

@Data
@Document(collection = "Services")
public class Service {

    @Id
    private String id;

    private String serviceName;

    @DBRef
    @JsonIgnore
    private List<Personnel> personnels; // Reference to Personnel documents

    @DBRef
    @JsonSerialize(using = PersonnelReferenceSerializer.class) // Custom serializer
    @JsonIgnore
    private Personnel chefHierarchique; // Reference to the hierarchical chief

    public Personnel getChefHierarchique() {
        return this.chefHierarchique;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public List<Personnel> getPersonnels() {
        return personnels;
    }

    public void setPersonnels(List<Personnel> personnels) {
        this.personnels = personnels;
    }


    public void setChefHierarchique(Personnel chefHierarchique) {
        this.chefHierarchique = chefHierarchique;
    }
}