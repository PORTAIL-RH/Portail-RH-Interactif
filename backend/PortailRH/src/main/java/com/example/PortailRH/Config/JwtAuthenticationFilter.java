package com.example.PortailRH.Config;

import com.example.PortailRH.Util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

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
                requestURI.startsWith("/api/demande-formation/create") ||
                requestURI.startsWith("/api/demande-formation") ||
                requestURI.startsWith("/api/services/create") ||
                requestURI.startsWith("/api/services/all") ||

                requestURI.startsWith("/api/demande-autorisation/create") ||

                requestURI.startsWith("/api/Personnel/all") ||
                requestURI.startsWith("/api/demande-autorisation/personnel/{matPersId}") ||
                requestURI.startsWith("/api/demande-conge/personnel/{matPersId}") ||
                requestURI.startsWith("/api/demande-formation/personnel/{matPersId}") ||
                requestURI.startsWith("/api/demande-conge/create") ||
                requestURI.startsWith("/api/demande-document/create") ||
                requestURI.startsWith("/api/demande-document") ||
                requestURI.startsWith("/api/demande-pre-avance/create") ||
                requestURI.startsWith("/api/demande-pre-avance") ||
                requestURI.startsWith("/api/demande-pre-avance/types") ||




                requestURI.startsWith("/api/demande-autorisation") ||
                requestURI.startsWith("/api/demande-conge") ||
                requestURI.startsWith("/api/titres") ||
                requestURI.startsWith("/api/types") ||
                requestURI.startsWith("/api/titres/{id}") ||
                requestURI.startsWith("/api/titres/create") ||
                requestURI.startsWith("/api/types/create") ||
                requestURI.startsWith("/api/titres/") ||
                requestURI.startsWith("/api/titres/{id}/types") ||
                requestURI.startsWith("/api/types/{id}/themes") ||

                requestURI.startsWith("/api/titres/{titreId}/types/{typeId}/themes") ||


                requestURI.startsWith("api/Personnel/addWithMatriculeAndEmail")||
                requestURI.startsWith("/api/admin/Login") ||
                requestURI.startsWith("/api/admin/activate-personnel") ||
                requestURI.startsWith("/api/admin/desactivate-personnel") ||
                requestURI.startsWith("/api//updateAllFields/{id}")||
                requestURI.startsWith("/api/notifications")) {
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