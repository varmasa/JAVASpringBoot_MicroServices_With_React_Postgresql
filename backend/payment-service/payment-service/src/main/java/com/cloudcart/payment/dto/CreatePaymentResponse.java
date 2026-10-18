package com.cloudcart.payment.dto;

public record CreatePaymentResponse(
    String orderReference,
    String razorpayOrderId,
    String keyId,
    long amount,
    String currency,
    String status
) {}