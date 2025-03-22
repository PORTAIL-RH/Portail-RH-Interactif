package com.example.PortailRH.Model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Data
@Document(collection = "Services")
public class Service {

    @Id
    private String serviceId; // Changed to camelCase for consistency

    private String serviceName;

    @DBRef
    @JsonBackReference // Marks this as the "child" side of the relationship
    private List<Personnel> personnels; // Reference to Personnel documents

    @DBRef
    @JsonManagedReference // Marks this as the "owner" of the relationship
    private Personnel chefHierarchique; // Reference to the hierarchical chief

    public Personnel getChefHierarchique() {
        return this.chefHierarchique;
    }
    public String getServiceId() {
        return serviceId;
    }

    public void setServiceId(String serviceId) {
        this.serviceId = serviceId;
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