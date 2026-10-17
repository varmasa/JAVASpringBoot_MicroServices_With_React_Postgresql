package com.cloudcart.cartservice.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.ResourceAccessException;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(
        IllegalArgumentException ex
    ) {
        return ResponseEntity.badRequest().body(
            Map.of("message", ex.getMessage())
        );
    }

    @ExceptionHandler(ResourceAccessException.class)
    public ResponseEntity<Map<String, String>> handleServiceUnavailable(
        ResourceAccessException ex
    ) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(
            Map.of("message", "Product Service is unavailable")
        );
    }

    @ExceptionHandler(RestClientResponseException.class)
    public ResponseEntity<Map<String, String>> handleProductServiceError(
        RestClientResponseException ex
    ) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(
            Map.of("message", "Product Service returned an error")
        );
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleServerError(
        IllegalStateException ex
    ) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(
            Map.of("message", ex.getMessage())
        );
    }
}