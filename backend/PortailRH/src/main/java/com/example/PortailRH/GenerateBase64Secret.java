package com.example.PortailRH;

import java.util.Base64;
import java.util.UUID;

public class GenerateBase64Secret {
    public static void main(String[] args) {
        // Generate a random secret key
        String secretKey = UUID.randomUUID().toString().replace("-", "");

        // Encode the secret key in Base64
        String base64EncodedKey = Base64.getEncoder().encodeToString(secretKey.getBytes());

        System.out.println("Base64 Encoded Secret Key: " + base64EncodedKey);
    }
}