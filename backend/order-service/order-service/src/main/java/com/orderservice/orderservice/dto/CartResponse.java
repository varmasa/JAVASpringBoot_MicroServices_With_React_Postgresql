package com.orderservice.orderservice.dto;

import java.math.BigDecimal;
import java.util.List;

public record CartResponse(
    List<CartItem> items,
    Integer totalItems,
    BigDecimal totalPrice
) {
    public record CartItem(
        Long productId,
        String productName,
        BigDecimal price,
        Integer quantity,
        BigDecimal subtotal
    ) {}
}