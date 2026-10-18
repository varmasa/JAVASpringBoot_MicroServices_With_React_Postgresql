
package com.cloudcart.review.config;

import com.cloudcart.review.security.JwtAuthenticationFilter;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
            .csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults())

            .sessionManagement(session -> session
                .sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS
                )
            )

            .authorizeHttpRequests(auth -> auth

                // Allow browser preflight requests
                .requestMatchers(HttpMethod.OPTIONS, "/**")
                .permitAll()

                // Anyone can view reviews and summaries
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/reviews/product/**"
                ).permitAll()

                // Login required to submit a review
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/reviews"
                ).authenticated()

                // Login required to update a review
                .requestMatchers(
                    HttpMethod.PUT,
                    "/api/reviews/**"
                ).authenticated()

                // Login required to delete a review
                .requestMatchers(
                    HttpMethod.DELETE,
                    "/api/reviews/**"
                ).authenticated()

                // Login required to view your own reviews
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/reviews/my"
                ).authenticated()

                // Protect any other review endpoint
                .requestMatchers("/api/reviews/**")
                .authenticated()

                .anyRequest().permitAll()
            )

            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }
}