
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

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter, WebConfig webConfig) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.webConfig = webConfig;
    }

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
                        .requestMatchers(HttpMethod.GET, "/api/Personnel/gender-distribution").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/Personnel/activation-status").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demande-conge/personnel/{matPersId}/accepted").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/Personnel/collaborateurs-by-chef/{chefId}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/Personnel/active").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/Personnel/matricule/{matricule}").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/Personnel/reset-password").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/Personnel/request-password-reset").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/Personnel/validate-reset-token").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/Personnel/matricules").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/Personnel/max-matricule").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/Personnel/locked-accounts").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/Personnel/unlock-account").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/Personnel/change-password/{userId}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/Personnel/role-distribution").permitAll()



                        .requestMatchers(HttpMethod.GET, "/api/demande-conge/collaborateurs-by-service/{chefserviceid}/approved").permitAll()


                        //Services Endpoints
                        .requestMatchers(HttpMethod.POST, "/api/services/create").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/services/all").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/services/by-chef/{chefId}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/services/{id}").permitAll()
                        .requestMatchers(HttpMethod.DELETE, "/api/services/delete/{id}").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/services/update/{id}").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/services/{serviceId}/assign-chefs").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/services/basic").permitAll()



                        //notification endpoints
                        .requestMatchers(HttpMethod.GET, "/api/notifications").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/notifications/{id}/view").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/notifications/unread").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/notifications/unreadnbr").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/notifications/nbr").permitAll()
                        .requestMatchers(HttpMethod.GET, "/ws/**").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/notifications/mark-all-read").permitAll()

                        //roles endpoints

                        .requestMatchers(HttpMethod.POST, "/api/roles/add").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/roles").permitAll()
                        //admin endpoints

                        .requestMatchers(HttpMethod.POST, "/api/admin/activate-personnel/{id}").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/admin/desactivate-personnel/{id}").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/admin/register").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/admin/Login").permitAll()


                        //demandeConge endpoints
                        .requestMatchers(HttpMethod.POST, "/api/demande-conge/create").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demande-conge").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demande-conge/personnel/{matPersId}").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/demande-conge/valider/{id}").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/demande-conge/refuser/{id}").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/demande-conge/traiter/{id}").permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/demande-conge/approved").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/demande-conge/{id}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demande-conge/collaborateurs-by-service/{chefserviceid}").permitAll()
                        .requestMatchers(HttpMethod.DELETE, "/api/demande-conge/{id}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demande-conge/days-used/{matPersId}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demande-conge/personnel/{matPersId}/approved").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demande-conge/personnel/{matPersId}/approved-by-chef1").permitAll()


                        ///demande document endpoints
                        .requestMatchers(HttpMethod.POST, "/api/demande-document/create").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demande-document").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/demande-document/valider/{id}").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/demande-document/refuser/{id}").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/demande-document/traiter/{id}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demande-document/personnel/{matPersId}").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/demande-document/{id}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demande-document/personnel/{matPersId}/files-reponse").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demande-document/collaborateurs-by-service/{chefserviceid}").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/demande-document/{id}/add-response-file").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demande-document/download/{fileName:.+}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demande-document/approved").permitAll()
                        .requestMatchers(HttpMethod.DELETE, "/api/demande-document/{id}").permitAll()



                        ///demande pre avance
                        .requestMatchers(HttpMethod.POST, "/api/demande-pre-avance/create").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demande-pre-avance").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demande-pre-avance/types").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/demande-pre-avance/valider/{id}").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/demande-pre-avance/refuser/{id}").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/demande-pre-avance/traiter/{id}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demande-pre-avance/personnel/{matPersId}").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/demande-pre-avance/{id}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demande-pre-avance/collaborateurs-by-service/{chefserviceid}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demande-pre-avance/approved").permitAll()
                        .requestMatchers(HttpMethod.DELETE, "/api/demande-pre-avance/{id}").permitAll()

                        //demandeformation endpoints
                        .requestMatchers(HttpMethod.POST, "/api/demande-formation/create").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demande-formation").permitAll()
                        .requestMatchers(HttpMethod.DELETE, "/api/demande-formation/{id}").permitAll()

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
                        .requestMatchers(HttpMethod.PUT, "/api/demande-formation/valider/{id}").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/demande-formation/refuser/{id}").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/demande-formation/traiter/{id}").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/demande-formation/{id}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demande-formation/collaborateurs-by-service/{chefserviceid}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demande-formation/approved").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demande-formation/personnel/{matPersId}/approved").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demande-formation/personnel/{matPersId}/approved-by-chef1").permitAll()


                        //demandeautorisation endpoints

                        .requestMatchers(HttpMethod.POST, "/api/demande-autorisation/create").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demande-autorisation/personnel/{matPersId}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demande-autorisation").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/demande-autorisation/valider/{id}").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/demande-autorisation/refuser/{id}").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/demande-autorisation/traiter/{id}").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/candidatures").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/demande-autorisation/{id}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demande-autorisation/collaborateurs-by-service/{chefserviceid}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demande-autorisation/approved").permitAll()
                        .requestMatchers(HttpMethod.DELETE, "/api/demande-autorisation/{id}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demande-autorisation/personnel/{matPersId}/approved").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demande-autorisation/personnel/{matPersId}/approved-by-chef1").permitAll()

                        //candidat/candidatures enpoints
                        .requestMatchers(HttpMethod.GET, "/api/candidatures").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/candidatures/disponibles").permitAll()

                        .requestMatchers(HttpMethod.POST, "/api/candidats").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/candidats").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/upload/cv").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/upload/cv/{id}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/candidatures/${candidatureId}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/candidats/byCandidature/{candidatureId}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/candidats/by-position/{positionId}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/candidats/{id}/cv").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/candidats/{positionId}/candidate-count").permitAll()



                        //Sse endpoints
                        .requestMatchers(HttpMethod.GET, "/api/sse/updates").permitAll()


                        // Specific endpoint permissions
                        .requestMatchers(HttpMethod.POST, "/api/societes").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/societes").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/societes/**").permitAll()
                        .requestMatchers(HttpMethod.DELETE, "/api/societes/**").permitAll()



                        //file
                        .requestMatchers(HttpMethod.GET, "/api/files/download/{fileId}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/files/metadata/{fileId}").permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/files/{fileId}").permitAll()


                        //validator Endpoints

                        .requestMatchers(HttpMethod.GET, "api/validators/chef-services/{chefId}").permitAll()
                        .requestMatchers(HttpMethod.GET, "api/validators/by-chef/{chefId}").permitAll()



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
