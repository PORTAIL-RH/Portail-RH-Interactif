package com.example.PortailRH.Util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {
    @Value("${jwt.secret}")
    private String secret;
    @Value("${jwt.secret}") // Load the secret key from application.properties
    private String SECRET_KEY;

    // Generate a SecretKey from the base64-encoded secret
    private SecretKey getSigningKey() {
        byte[] keyBytes = Base64.getDecoder().decode(SECRET_KEY);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // Extract the username from the token
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // Extract expiration date from token
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    // Generic method to extract a claim
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    // Extract all claims from token
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // Check if the token is expired
    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // Validate the token
    public Boolean validateToken(String token, String username) {
        final String extractedUsername = extractUsername(token);
        return (extractedUsername.equals(username) && !isTokenExpired(token));
    }

    // Generate a JWT token without extra claims
    public String generateToken(String username) {
        Map<String, Object> claims = new HashMap<>();
        return createToken(claims, username);
    }

    // Create token with default expiration (2 days)
    private String createToken(Map<String, Object> claims, String subject) {
        return createToken(claims, subject, 1000 * 60 * 60 * 24 * 2); // 2 days expiration
    }
    public Boolean validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(secret).parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    // Create token with custom expiration
    private String createToken(Map<String, Object> claims, String subject, long expiration) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // Password reset specific methods
    private static final long PASSWORD_RESET_EXPIRATION = 86400000; // 24 hours

    public String generatePasswordResetToken(String email) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("isPasswordReset", true);
        return createToken(claims, email, PASSWORD_RESET_EXPIRATION);
    }

    public boolean isPasswordResetToken(String token) {
        try {
            final Claims claims = extractAllClaims(token);
            Boolean isResetToken = claims.get("isPasswordReset", Boolean.class);
            return isResetToken != null && isResetToken;
        } catch (Exception e) {
            return false;
        }
    }
    public Boolean isTokenValid(String token, String username) {
        return validateToken(token, username);
    }


    public Boolean validatePasswordResetToken(String token) {
        try {
            Claims claims = extractAllClaims(token);
            Boolean isResetToken = claims.get("isPasswordReset", Boolean.class);
            return isResetToken != null && isResetToken && !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }
}