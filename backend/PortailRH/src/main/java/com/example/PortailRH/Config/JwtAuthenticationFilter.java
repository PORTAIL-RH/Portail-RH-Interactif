package com.example.PortailRH.Config;

import com.example.PortailRH.Util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String requestURI = request.getRequestURI();
        System.out.println("Request URI: " + requestURI);

        // Skip authentication for specific endpoints
        if (requestURI.startsWith("/api/Personnel/register") ||
                requestURI.startsWith("/api/Personnel/login") ||
                requestURI.startsWith("/api/admin/register") ||
                requestURI.startsWith("/api/Personnel/gender-distribution") ||
                requestURI.startsWith("/api/Personnel/activation-status") ||
                requestURI.startsWith("/api/Personnel/all") ||
                requestURI.startsWith("api/Personnel/addWithMatriculeAndEmail")||
                requestURI.contains("/api/personnel/updateAllFields/")||
                requestURI.startsWith("/api/personnel/updateAllFields")||
                requestURI.startsWith("/api/Personnel/collaborateurs-by-chef/{chefId}")||
                requestURI.startsWith("/api/Personnel/request-password-reset")||
                requestURI.startsWith("/api/Personnel/reset-password")||
                requestURI.startsWith("/api/Personnel/validate-reset-token")||
                requestURI.startsWith("/api/Personnel/request-password-reset-mobile")||
                requestURI.startsWith("/api/Personnel/reset-password-mobile")||
                requestURI.startsWith("/api/Personnel/validate-reset-token-mobile")||
                requestURI.startsWith("/api/Personnel/matricules")||
                requestURI.startsWith("/api/societes") ||
                requestURI.startsWith("/api/Personnel/matricule/{matricule}")||
                requestURI.startsWith("/api/Personnel/active")||
                requestURI.startsWith("/api/Personnel/max-matricule")||
                requestURI.startsWith("/api/Personnel/locked-accounts")||
                requestURI.startsWith("/api/Personnel/unlock-account")||
                requestURI.startsWith("/api/Personnel/role-distribution")||

                requestURI.startsWith("/api/Personnel/change-password/{userId}")||

                requestURI.startsWith("/api/files/download/{fileId}")||
                requestURI.startsWith("/api/files/{fileId}")||
                requestURI.startsWith("/api/files/metadata/{fileId}")||



                requestURI.startsWith("/api/demande-conge/collaborateurs-by-service/{chefserviceid}/approved")||

                requestURI.startsWith("/api/demande-conge/personnel/{matPersId}/accepted")||


                requestURI.startsWith("/api/admin/Login") ||
                requestURI.startsWith("/api/admin/activate-personnel/{id}") ||
                requestURI.startsWith("/api/admin/desactivate-personnel/{id}") ||

                requestURI.startsWith("/api/demande-formation/collaborateurs-by-service/{chefserviceid}") ||
                requestURI.startsWith("/api/demande-formation/create") ||
                requestURI.startsWith("/api/demande-formation") ||
                requestURI.startsWith("/api/demande-formation/{id}") ||
                requestURI.startsWith("/api/demande-formation/{id}/details") ||
                requestURI.startsWith("/api/demande-formation/personnel/{matPersId}") ||
                requestURI.startsWith("/api/demande-formation/valider/{id}") ||
                requestURI.startsWith("/api/demande-formation/refuser/{id}") ||
                requestURI.startsWith("/api/demande-formation/traiter/{id}") ||
                requestURI.startsWith("/api/titres") ||
                requestURI.startsWith("/api/types") ||
                requestURI.startsWith("/api/titres/{id}") ||
                requestURI.startsWith("/api/titres/create") ||
                requestURI.startsWith("/api/types/create") ||
                requestURI.startsWith("/api/titres/") ||
                requestURI.startsWith("/api/titres/{id}/types") ||
                requestURI.startsWith("/api/types/{id}/themes") ||
                requestURI.startsWith("/api/titres/{titreId}/types/{typeId}/themes") ||
                requestURI.startsWith("/api/demande-formation/approved") ||
                requestURI.startsWith("/api/demande-formation/personnel/{matPersId}/approved") ||
                requestURI.startsWith("/api/demande-formation/personnel/{matPersId}/approved-by-chef1") ||



                requestURI.startsWith("/api/demande-autorisation/create") ||
                requestURI.startsWith("/api/demande-autorisation/{id}") ||
                requestURI.startsWith("/api/demande-autorisation/personnel/{matPersId}") ||
                requestURI.startsWith("/api/demande-autorisation/refuser/{id}") ||
                requestURI.startsWith("/api/demande-autorisation/traiter/{id}") ||
                requestURI.startsWith("/api/demande-autorisation/valider/{id}") ||
                requestURI.startsWith("/api/demande-autorisation/collaborateurs-by-service/{chefserviceid}") ||
                requestURI.startsWith("/api/demande-autorisation/approved") ||
                requestURI.startsWith("/api/demande-autorisation/personnel/{matPersId}/approved") ||
                requestURI.startsWith("/api/demande-autorisation/personnel/{matPersId}/approved-by-chef1") ||



                requestURI.startsWith("/api/demande-conge/personnel/{matPersId}") ||
                requestURI.startsWith("/api/demande-conge/create") ||
                requestURI.startsWith("/api/demande-conge/approved") ||
                requestURI.startsWith("/api/demande-conge/valider/{id}") ||
                requestURI.startsWith("/api/demande-conge/refuser/{id}") ||
                requestURI.startsWith("/api/demande-conge/traiter/{id}") ||
                requestURI.startsWith("/api/demande-conge") ||
                requestURI.startsWith("/api/demande-conge/{id}") ||
                requestURI.startsWith("/api/demande-conge/collaborateurs-by-service/{chefserviceid}") ||
                requestURI.startsWith("/api/demande-conge/days-used/{matPersId}") ||
                requestURI.startsWith("/api/demande-conge/personnel/{matPersId}/approved") ||
                requestURI.startsWith("/api/demande-conge/personnel/{matPersId}/approved-by-chef1") ||


                requestURI.startsWith("/api/demande-document/valider/{id}") ||
                requestURI.startsWith("/api/demande-document/traiter/{id}") ||
                requestURI.startsWith("/api/demande-document/refuser/{id}") ||
                requestURI.startsWith("/api/demande-document/create") ||
                requestURI.startsWith("/api/demande-document") ||
                requestURI.startsWith("/api/demande-document/{id}/add-response-file") ||
                requestURI.startsWith("/api/demande-document/approved") ||

                requestURI.startsWith("/api/demande-document/download/{fileName:.+}" +
                        "") ||

                requestURI.startsWith("/api/demande-document/{id}") ||
                requestURI.startsWith("/api/demande-document/personnel/{matPersId}/files-reponse") ||
                requestURI.startsWith("/api/demande-document/collaborateurs-by-service/{chefserviceid}") ||


                requestURI.startsWith("/api/demande-pre-avance/valiser/{id}") ||
                requestURI.startsWith("/api/demande-pre-avance/refuser/{id}") ||
                requestURI.startsWith("/api/demande-pre-avance/traiter/{id}") ||
                requestURI.startsWith("/api/demande-pre-avance/create") ||
                requestURI.startsWith("/api/demande-pre-avance") ||
                requestURI.startsWith("/api/demande-pre-avance/{id}") ||
                requestURI.startsWith("/api/demande-pre-avance/types") ||
                requestURI.startsWith("/api/demande-pre-avance/collaborateurs-by-service/{chefserviceid}") ||
                requestURI.startsWith("/api/demande-pre-avance/approved") ||

                requestURI.startsWith("/api/services/create") ||
                requestURI.startsWith("/api/services/all") ||
                requestURI.startsWith("/api/services/{id}") ||
                requestURI.startsWith("/api/services/by-chef/{chefId}") ||
                requestURI.startsWith("/api/services/update/{id}") ||
                requestURI.startsWith("/api/services/delete/{id}") ||
                requestURI.startsWith("/api/services/{serviceId}/assign-chefs") ||
                requestURI.startsWith("/api/services/basic") ||



                requestURI.startsWith("/sse/updates") ||


                requestURI.startsWith("/api/candidatures") ||
                requestURI.startsWith("/api/candidatures/disponibles") ||

                requestURI.startsWith("/api/candidats") ||
                requestURI.startsWith("/api/upload/cv") ||
                requestURI.startsWith("/api/upload/cv/{id}") ||
                requestURI.startsWith("/api/candidatures/${candidatureId}") ||
                requestURI.startsWith("/api/updateAllFields/{id}")||
                requestURI.startsWith("/api/candidats/by-position/{positionId}")||
                requestURI.startsWith("/api/candidats/{id}/cv") ||
                requestURI.startsWith("/api/candidats/{positionId}/candidate-count") ||


                requestURI.startsWith("/api/notifications/mark-all-read") ||
                requestURI.startsWith("/api/notifications/unreadnbr") ||
                requestURI.startsWith("/api/notifications")||
                requestURI.startsWith("/api/notifications/unread-for-user")||
                requestURI.startsWith("/api/notifications/{id}/mark-read-by")||
                requestURI.startsWith("/api/notifications/{id}/mark-all-read-by-user")||
                requestURI.startsWith("/api/notifications/unread-count-for-user"))


        {
            System.out.println("Skipping JWT filter for: " + requestURI); // Log skipped URIs
            filterChain.doFilter(request, response);
            return;
        }

        // Extract the Authorization header
        String authorizationHeader = request.getHeader("Authorization");

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            String token = authorizationHeader.substring(7);

            try {
                // Validate the token and set authentication
                String username = jwtUtil.extractUsername(token);
                if (username != null && jwtUtil.isTokenValid(token, username)) {
                    UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                            username, null, null);
                    SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                }
            } catch (Exception e) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("Invalid or expired JWT token");
                return;
            }
        }
        System.out.println("Request URI: " + requestURI);
        filterChain.doFilter(request, response);
    }}