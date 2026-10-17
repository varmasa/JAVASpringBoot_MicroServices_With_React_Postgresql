
package com.cloudcart.auth.controller;

import com.cloudcart.auth.dto.AuthResponse;
import com.cloudcart.auth.dto.SigninRequest;
import com.cloudcart.auth.dto.SignupRequest;
import com.cloudcart.auth.model.User;
import com.cloudcart.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    public AuthResponse signup(
        @Valid @RequestBody SignupRequest request
    ) {
        return authService.signup(request);
    }

    @PostMapping("/signin")
    public AuthResponse signin(
        @Valid @RequestBody SigninRequest request
    ) {
        return authService.signin(request);
    }

    @GetMapping("/me")
    public Map<String, Object> me(Authentication authentication) {
        User user = authService.getUserByEmail(
            authentication.getName()
        );

        return Map.of(
            "id", user.getId(),
            "name", user.getName(),
            "email", user.getEmail(),
            "role", user.getRole(),
            "createdAt", user.getCreatedAt().toString()
        );
    }
}
