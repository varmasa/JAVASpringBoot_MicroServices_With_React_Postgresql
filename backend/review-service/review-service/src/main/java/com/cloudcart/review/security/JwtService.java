
package com.cloudcart.review.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
public class JwtService {

    private final SecretKey signingKey;

    public JwtService(
            @Value("${app.jwt.secret}") String secret) {

        this.signingKey = Keys.hmacShaKeyFor(
                Decoders.BASE64.decode(secret)
        );
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Long extractUserId(String token) {
        Claims claims = extractAllClaims(token);

        Object userId = claims.get("userId");

        if (userId != null) {
            return Long.valueOf(userId.toString());
        }

        return Long.valueOf(claims.getSubject());
    }

    public boolean isTokenValid(String token) {
        try {
            Claims claims = extractAllClaims(token);
            Date expiration = claims.getExpiration();

            return expiration != null
                    && expiration.after(new Date());

        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }

    public String extractUserEmail(String token) {
        Claims claims = extractAllClaims(token);

        String email = claims.get("email", String.class);

        if (email == null || email.isBlank()) {
            email = claims.getSubject();
        }

        if (email == null || !email.contains("@")) {
            throw new IllegalArgumentException(
                    "JWT does not contain a valid user email"
            );
        }

        return email.trim().toLowerCase();
    }
}