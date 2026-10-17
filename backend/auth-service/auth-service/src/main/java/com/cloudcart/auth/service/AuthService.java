
package com.cloudcart.auth.service;

import com.cloudcart.auth.dto.AuthResponse;
import com.cloudcart.auth.dto.SigninRequest;
import com.cloudcart.auth.dto.SignupRequest;
import com.cloudcart.auth.model.User;
import com.cloudcart.auth.repository.UserRepository;
import com.cloudcart.auth.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        String email = normalizeEmail(request.email());

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "An account with this email already exists"
            );
        }

        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPasswordHash(
            passwordEncoder.encode(request.password())
        );

        User savedUser = userRepository.save(user);

        return createResponse(savedUser);
    }

    @Transactional(readOnly = true)
    public AuthResponse signin(SigninRequest request) {
        String email = normalizeEmail(request.email());

        User user = userRepository.findByEmail(email)
            .orElseThrow(this::invalidCredentials);

        if (!passwordEncoder.matches(
            request.password(), user.getPasswordHash()
        )) {
            throw invalidCredentials();
        }

        return createResponse(user);
    }

    @Transactional(readOnly = true)
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(normalizeEmail(email))
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED, "User account not found"
            ));
    }

    private AuthResponse createResponse(User user) {
        return new AuthResponse(
            jwtService.generateToken(user.getEmail(), user.getRole()),
            "Bearer",
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getRole()
        );
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private ResponseStatusException invalidCredentials() {
        return new ResponseStatusException(
            HttpStatus.UNAUTHORIZED,
            "Invalid email or password"
        );
    }
}
