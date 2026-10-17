package com.cloudcart.cartservice.controller;

import com.cloudcart.cartservice.dto.*;
import com.cloudcart.cartservice.service.CartService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public CartResponse getCart(Authentication authentication) {
        return cartService.getCart(authentication.getName());
    }

    @PostMapping("/items")
    @ResponseStatus(HttpStatus.CREATED)
    public CartResponse addItem(
        Authentication authentication,
        @Valid @RequestBody AddCartItemRequest request
    ) {
        return cartService.addItem(authentication.getName(), request);
    }

    @PutMapping("/items/{productId}")
    public CartResponse updateItem(
        Authentication authentication,
        @PathVariable Long productId,
        @Valid @RequestBody UpdateCartItemRequest request
    ) {
        return cartService.updateItem(
            authentication.getName(), productId, request
        );
    }

    @DeleteMapping("/items/{productId}")
    public CartResponse removeItem(
        Authentication authentication,
        @PathVariable Long productId
    ) {
        return cartService.removeItem(
            authentication.getName(), productId
        );
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clearCart(Authentication authentication) {
        cartService.clearCart(authentication.getName());
    }
}