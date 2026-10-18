package com.orderservice.orderservice.entity;

public enum OrderStatus {
    PLACED,
    PAYMENT_PENDING,
    PAID,
    CONFIRMED,
    PROCESSING,
    SHIPPED,
    DELIVERED,
    CANCELLED
}