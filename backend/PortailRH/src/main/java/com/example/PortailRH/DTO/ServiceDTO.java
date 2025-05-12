package com.example.PortailRH.DTO;

public class ServiceDTO {
    private String serviceId;
    private String serviceName;
    private String chefMatricule;

    public ServiceDTO(String serviceId, String serviceName, String chefMatricule) {
        this.serviceId = serviceId;
        this.serviceName = serviceName;
        this.chefMatricule = chefMatricule;
    }

    // Getters and Setters
    public String getServiceId() { return serviceId; }
    public void setServiceId(String serviceId) { this.serviceId = serviceId; }
    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }
    public String getChefMatricule() { return chefMatricule; }
    public void setChefMatricule(String chefMatricule) { this.chefMatricule = chefMatricule; }
}