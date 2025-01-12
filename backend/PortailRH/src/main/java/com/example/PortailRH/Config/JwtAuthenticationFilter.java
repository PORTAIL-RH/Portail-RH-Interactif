package com.example.PortailRH.Config;

import com.example.PortailRH.Util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
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

        // Skip authentication for specific endpoints
        if (request.getRequestURI().startsWith("/api/Collaborateur/register") ||
                request.getRequestURI().startsWith("/api/Collaborateur/login") ||
                request.getRequestURI().startsWith("/api/notifications")) {  // Add /api/notifications
            filterChain.doFilter(request, response);  // Let the request pass without authentication
            return;
        }

        // Extract the Authorization header
        String authorizationHeader = request.getHeader("Authorization");

        // Check if the header starts with "Bearer "
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            String token = authorizationHeader.substring(7); // Remove the "Bearer " prefix

            try {
                // Validate the token and extract the username
                String username = jwtUtil.extractUsername(token);

                if (username != null && SecurityContextHolder.getContext().getAuthentication() == null && jwtUtil.isTokenValid(token, username)) {
                    // Add the authenticated user to the security context
                    UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                            username, null, null); // You can add roles here if needed
                    authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                }
            } catch (Exception e) {
                // If an exception is thrown (e.g., token expired), return a 401 status
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("Invalid or expired JWT token");
                return;
            }
        }

        // Continue the filter chain for other requests
        filterChain.doFilter(request, response);
    }

}