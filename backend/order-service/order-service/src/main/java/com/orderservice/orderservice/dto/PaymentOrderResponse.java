package com.orderservice.orderservice.dto;

public record PaymentOrderResponse(
    String orderReference,
    String razorpayOrderId,
    String keyId,
    long amount,
    String currency,
    String status
) {}