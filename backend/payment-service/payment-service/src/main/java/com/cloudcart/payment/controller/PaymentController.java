
package com.cloudcart.payment.controller;

import com.cloudcart.payment.dto.*;
import com.cloudcart.payment.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.MessageDigest;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;
    private final String internalSecret;

    public PaymentController(
        PaymentService paymentService,
        @Value("${app.internal-service-secret}") String internalSecret
    ) {
        this.paymentService = paymentService;
        this.internalSecret = internalSecret;
    }

    @PostMapping("/orders")
    public CreatePaymentResponse createOrder(
        @RequestHeader("X-Internal-Service-Secret") String suppliedSecret,
        @Valid @RequestBody CreatePaymentRequest request
    ) {
        if (!constantTimeEquals(internalSecret, suppliedSecret)) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN, "Not authorized to create payment orders"
            );
        }

        return paymentService.createOrder(request);
    }

    @PostMapping("/verify")
    public PaymentStatusResponse verify(
        @Valid @RequestBody VerifyPaymentRequest request
    ) {
        return paymentService.verifyPayment(request);
    }

    @GetMapping("/{razorpayOrderId}/status")
    public PaymentStatusResponse status(
        @PathVariable String razorpayOrderId
    ) {
        return paymentService.getStatus(razorpayOrderId);
    }

    private boolean constantTimeEquals(String expected, String supplied) {
        if (expected == null || supplied == null) {
            return false;
        }
        return MessageDigest.isEqual(
            expected.getBytes(java.nio.charset.StandardCharsets.UTF_8),
            supplied.getBytes(java.nio.charset.StandardCharsets.UTF_8)
        );
    }
}