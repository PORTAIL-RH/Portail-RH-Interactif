package com.example.PortailRH.Config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Allow frontend origin (React app running on localhost:3000)
        configuration.setAllowedOrigins(Arrays.asList(
                "http://localhost:3000",
                "http://localhost:3001",
                "http://192.168.1.56",
                "http://localhost:8081",
                "http://192.168.1.52", //islem
                "http://172.20.10.2", //islem-fifi
                "http://localhost:19006", // Allow requests from your React Native app
                "http://192.168.1.32",
                "http://172.20.10.7",
                "http://192.168.1.32:8080",
                "http://192.168.1.32:8081",  // Expo development server
                "http://192.168.1.32:9070",  // Backend server
                "exp://192.168.1.32:8081"    // Expo URL
        ));        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}