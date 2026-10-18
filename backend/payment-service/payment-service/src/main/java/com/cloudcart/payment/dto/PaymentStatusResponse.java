
package com.cloudcart.payment.dto;

import java.math.BigDecimal;

public record PaymentStatusResponse(
    String orderReference,
    String razorpayOrderId,
    String razorpayPaymentId,
    BigDecimal amount,
    String currency,
    String status
) {}