package com.example.PortailRH.Model;

import com.example.PortailRH.Config.PersonnelReferenceSerializer;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "Services")
public class Service {

    @Id
    private String id;

    private String serviceName;

    @DBRef
    @JsonSerialize(using = PersonnelReferenceSerializer.class)
    @JsonIgnore
    private Personnel chef1;
    private int poid1;

    @DBRef
    @JsonSerialize(using = PersonnelReferenceSerializer.class)
    @JsonIgnore
    private Personnel chef2;
    private int poid2;

    @DBRef
    @JsonSerialize(using = PersonnelReferenceSerializer.class)
    @JsonIgnore
    private Personnel chef3;
    private int poid3;

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

    public Personnel getChef1() {
        return chef1;
    }

    public void setChef1(Personnel chef1) {
        this.chef1 = chef1;
    }

    public int getPoid1() {
        return poid1;
    }

    public void setPoid1(int poid1) {
        this.poid1 = poid1;
    }

    public Personnel getChef2() {
        return chef2;
    }

    public void setChef2(Personnel chef2) {
        this.chef2 = chef2;
    }

    public int getPoid2() {
        return poid2;
    }

    public void setPoid2(int poid2) {
        this.poid2 = poid2;
    }

    public Personnel getChef3() {
        return chef3;
    }

    public void setChef3(Personnel chef3) {
        this.chef3 = chef3;
    }

    public int getPoid3() {
        return poid3;
    }

    public void setPoid3(int poid3) {
        this.poid3 = poid3;
    }
}