
package com.cloudcart.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;
import java.math.BigDecimal;

public record CreatePaymentRequest(
    @NotBlank String orderReference,
    @NotNull @DecimalMin("0.01") BigDecimal amount
) {}