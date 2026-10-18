package com.orderservice.orderservice.dto;

import java.math.BigDecimal;

public record VerifyPaymentResponse(
    String status,
    String orderReference,
    String razorpayOrderId,
    String razorpayPaymentId,
    BigDecimal amount,
    String currency
) {
}