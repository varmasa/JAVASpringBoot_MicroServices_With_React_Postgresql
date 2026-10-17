package com.orderservice.orderservice.dto;

import com.orderservice.orderservice.entity.OrderStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record CreateOrderResponse(
    Long orderId,
    String userEmail,
    BigDecimal totalAmount,
    OrderStatus status,
    LocalDateTime createdAt,
    List<Item> items
) {
    public record Item(
        Long productId,
        String productName,
        BigDecimal unitPrice,
        Integer quantity,
        BigDecimal subtotal
    ) {}
}