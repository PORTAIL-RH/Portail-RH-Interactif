package com.example.PortailRH.DTO;


import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public class ChefAssignmentDto {
    @NotBlank(message = "Personnel ID is required")
    private String personnelId;

    @Min(value = 1, message = "Poid must be at least 1")
    @Max(value = 3, message = "Poid must be at most 3")
    private int poid;

    public String getPersonnelId() {
        return personnelId;
    }

    public void setPersonnelId(String personnelId) {
        this.personnelId = personnelId;
    }

    public int getPoid() {
        return poid;
    }

    public void setPoid(int poid) {
        this.poid = poid;
    }
}
