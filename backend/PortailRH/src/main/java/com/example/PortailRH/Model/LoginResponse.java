package com.example.PortailRH.Model;

public class LoginResponse {
    private String token;
    private String id;

    public LoginResponse(String token, String id) {
        this.token = token;
        this.id = id;
    }

    public String getToken() {
        return token;
    }

    public String getId() {
        return id;
    }
}
