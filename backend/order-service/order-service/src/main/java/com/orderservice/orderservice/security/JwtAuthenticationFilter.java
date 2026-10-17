package com.orderservice.orderservice.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final SecretKey key;

    public JwtAuthenticationFilter(
            @Value("${app.jwt.secret}") String secret) {
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null
                && header.startsWith("Bearer ")
                && SecurityContextHolder.getContext()
                    .getAuthentication() == null) {
            try {
                String token = header.substring(7);

                Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

                String email = claims.getSubject();
                Object roleClaim = claims.get("role");

                if (roleClaim == null) {
                    roleClaim = claims.get("roles");
                }

                List<String> roles;
                if (roleClaim instanceof String role) {
                    roles = List.of(role);
                } else if (roleClaim instanceof List<?> list) {
                    roles = list.stream()
                        .filter(String.class::isInstance)
                        .map(String.class::cast)
                        .toList();
                } else {
                    roles = List.of();
                }

                var authorities = roles.stream()
                    .map(role -> role.startsWith("ROLE_")
                        ? role
                        : "ROLE_" + role)
                    .map(SimpleGrantedAuthority::new)
                    .toList();

                if (email != null && !email.isBlank()) {
                    var authentication =
                        new UsernamePasswordAuthenticationToken(
                            email, null, authorities
                        );

                    SecurityContextHolder.getContext()
                        .setAuthentication(authentication);
                }

            } catch (io.jsonwebtoken.JwtException
                     | IllegalArgumentException ex) {
                SecurityContextHolder.clearContext();
                response.sendError(
                    HttpServletResponse.SC_UNAUTHORIZED,
                    "Invalid or expired JWT"
                );
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}