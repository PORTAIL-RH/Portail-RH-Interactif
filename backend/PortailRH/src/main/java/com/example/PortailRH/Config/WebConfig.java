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
                "http://localhost:8081",

                "http://192.168.1.52:8081", //islem C20D20
                "http://172.20.10.2:8081", //islem-fifi
                "http://192.168.43.70:8081",//orang
                "http://192.168.0.156:8081",//home or5B


                "http://172.20.10.7:8081",
                "http://192.168.1.32:8081",  // Expo development server
                "http://192.168.1.32:9070",  // Backend server
                "exp://192.168.1.32:8081",  // Expo URL

                "http://localhost:8081",
                "exp://127.0.0.1:8081",
                "http://127.0.0.1:8081",
                "exp://localhost:8081"
        ));        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}