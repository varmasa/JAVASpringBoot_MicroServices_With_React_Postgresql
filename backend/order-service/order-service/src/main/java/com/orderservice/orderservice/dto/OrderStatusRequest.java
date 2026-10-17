package com.orderservice.orderservice.dto;

import com.orderservice.orderservice.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record OrderStatusRequest(
    @NotNull OrderStatus status
) {}