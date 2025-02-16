
package com.example.PortailRH.Config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private WebConfig webConfig;

    @Bean
    public BCryptPasswordEncoder bCryptPasswordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public org.springframework.security.web.DefaultSecurityFilterChain securityFilterChain(HttpSecurity http, WebConfig webConfig) throws Exception {
        http
                .authorizeHttpRequests(auth -> auth
                        //personnel endpoints
                        .requestMatchers(HttpMethod.POST, "/api/Personnel/login", "/api/Personnel/register").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/Personnel/update").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/Personnel/all").permitAll()
                        .requestMatchers(HttpMethod.POST, "api/Personnel/addWithMatriculeAndEmail").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/Personnel/updateAllFields/{id}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/Personnel/byId/{id}").permitAll()

                        //notification endpoints
                        .requestMatchers(HttpMethod.GET, "/api/notifications").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/notifications/{id}/view").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/notifications/unread").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/notifications/unreadnbr").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/notifications/nbr").permitAll()


                        //roles endpoints

                        .requestMatchers(HttpMethod.POST, "/api/roles/add").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/roles").permitAll()
                        //admin endpoints

                        .requestMatchers(HttpMethod.POST, "/api/admin/activate-personnel/{id}").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/admin/desactivate-personnel/{id}").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/admin/register").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/admin/Login").permitAll()


                        //demandeConge endpoints
                        .requestMatchers(HttpMethod.GET, "/api/demande-conge/all").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/demande-conge/create").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demande-conge").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demande-conge/personnel/{matPersId}").permitAll()

                        ///demande document endpoints
                        .requestMatchers(HttpMethod.POST, "/api/demande-document/create").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demande-document").permitAll()

                        ///demande pre avance
                        .requestMatchers(HttpMethod.POST, "/api/demande-pre-avance/create").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demande-pre-avance").permitAll()

                        //demandeformation endpoints
                        .requestMatchers(HttpMethod.POST, "/api/demande-formation/create").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/themes/create").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/titres/create").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/types/create").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/themes").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/titres/{id}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/titres", "/api/titres/").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/types").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/titres/{id}/types").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/titres/{titreId}/types/{typeId}/themes").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demande-formation/personnel/{matPersId}").permitAll()


                        //demandeautorisation endpoints

                        .requestMatchers(HttpMethod.POST, "/api/demande-autorisation/create").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demande-autorisation/personnel/{matPersId}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demande-autorisation").permitAll()




                        .anyRequest().authenticated()
                )
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(webConfig.corsConfigurationSource()))
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(401);
                            response.getWriter().write("Unauthorized: Authentication is required.");
                        })
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                );

        // Add the JWT filter
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
