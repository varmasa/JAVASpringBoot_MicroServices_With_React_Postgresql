package com.orderservice.orderservice.controller;

import com.orderservice.orderservice.dto.CreateOrderResponse;
import com.orderservice.orderservice.dto.OrderStatusRequest;
import com.orderservice.orderservice.service.OrderService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.orderservice.orderservice.dto.PaymentOrderResponse;
import com.orderservice.orderservice.dto.OrderPaymentVerificationRequest;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/checkout")
    public ResponseEntity<CreateOrderResponse> checkout(
            Authentication authentication,
            HttpServletRequest request) {

        String token = extractToken(request);

        CreateOrderResponse order = orderService.checkout(
            authentication.getName(), token
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

@PostMapping("/{id}/payment")
public ResponseEntity<PaymentOrderResponse> createPayment(
        @PathVariable Long id,
        Authentication authentication) {

    return ResponseEntity.ok(
        orderService.createPaymentOrder(
            id, authentication.getName()
        )
    );
}

@PostMapping("/payment/verify")
public ResponseEntity<CreateOrderResponse> verifyPayment(
        @Valid @RequestBody OrderPaymentVerificationRequest request,
        Authentication authentication) {

    return ResponseEntity.ok(
        orderService.verifyOrderPayment(
            request, authentication.getName()
        )
    );
}

    @GetMapping
    public List<CreateOrderResponse> getMyOrders(
            Authentication authentication) {
        return orderService.getMyOrders(authentication.getName());
    }

    @GetMapping("/{id}")
    public CreateOrderResponse getMyOrder(
            @PathVariable Long id,
            Authentication authentication) {
        return orderService.getMyOrder(id, authentication.getName());
    }

    @PatchMapping("/admin/{id}/status")
    public CreateOrderResponse updateOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody OrderStatusRequest request) {

        return orderService.updateStatus(id, request.status());
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");

        if (header == null || !header.startsWith("Bearer ")) {
            throw new org.springframework.security.access
                .AccessDeniedException("Bearer token required");
        }

        return header.substring(7);
    }
}