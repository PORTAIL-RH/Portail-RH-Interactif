package com.example.PortailRH.Model;

public class ServiceDTO {
    private String serviceId;
    private String serviceName;
    private String chefHierarchiqueId; // Only include the ID of the chefHierarchique

    public ServiceDTO(String serviceId, String serviceName, String chefHierarchiqueId) {
        this.serviceId = serviceId;
        this.serviceName = serviceName;
        this.chefHierarchiqueId = chefHierarchiqueId;
    }

    // Getters and Setters
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

    public String getChefHierarchiqueId() {
        return chefHierarchiqueId;
    }

    public void setChefHierarchiqueId(String chefHierarchiqueId) {
        this.chefHierarchiqueId = chefHierarchiqueId;
    }
}