package com.orderservice.orderservice.service;

import com.orderservice.orderservice.dto.CartResponse;
import com.orderservice.orderservice.dto.CreateOrderResponse;
import com.orderservice.orderservice.entity.CustomerOrder;
import com.orderservice.orderservice.entity.OrderItem;
import com.orderservice.orderservice.entity.OrderStatus;
import com.orderservice.orderservice.repository.OrderRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.List;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final RestClient restClient;

    @Value("${app.cart-service.url}")
    private String cartServiceUrl;

    public OrderService(
            OrderRepository orderRepository,
            RestClient.Builder builder) {
        this.orderRepository = orderRepository;
        this.restClient = builder.build();
    }

    @Transactional
    public CreateOrderResponse checkout(String email, String token) {

        CartResponse cart = restClient.get()
            .uri(cartServiceUrl + "/api/cart")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
            .retrieve()
            .body(CartResponse.class);

        if (cart == null || cart.items() == null
                || cart.items().isEmpty()) {
            throw new IllegalStateException("Your cart is empty");
        }

        CustomerOrder order = new CustomerOrder();
        order.setUserEmail(email);
        order.setStatus(OrderStatus.PLACED);

        BigDecimal total = BigDecimal.ZERO;

        for (CartResponse.CartItem cartItem : cart.items()) {
            if (cartItem.productId() == null
                    || cartItem.price() == null
                    || cartItem.quantity() == null
                    || cartItem.quantity() <= 0
                    || cartItem.price().signum() < 0) {
                throw new IllegalStateException(
                    "Invalid item found in cart"
                );
            }

            OrderItem item = new OrderItem();
            item.setProductId(cartItem.productId());
            item.setProductName(cartItem.productName());
            item.setUnitPrice(cartItem.price());
            item.setQuantity(cartItem.quantity());

            BigDecimal subtotal = cartItem.price()
                .multiply(BigDecimal.valueOf(cartItem.quantity()));

            item.setSubtotal(subtotal);
            order.addItem(item);
            total = total.add(subtotal);
        }

        order.setTotalAmount(total);

        // Persist order and order items.
        CustomerOrder savedOrder = orderRepository.saveAndFlush(order);

        // Clear the user's cart only after the order has been saved.
        restClient.delete()
            .uri(cartServiceUrl + "/api/cart")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
            .retrieve()
            .toBodilessEntity();

        return toResponse(savedOrder);
    }

    @Transactional(readOnly = true)
    public List<CreateOrderResponse> getMyOrders(String email) {
        return orderRepository
            .findByUserEmailOrderByCreatedAtDesc(email)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public CreateOrderResponse getMyOrder(Long id, String email) {
        CustomerOrder order = orderRepository
            .findByIdAndUserEmail(id, email)
            .orElseThrow(() -> new OrderNotFoundException(id));

        return toResponse(order);
    }

    @Transactional
    public CreateOrderResponse updateStatus(
            Long id, OrderStatus status) {

        CustomerOrder order = orderRepository.findById(id)
            .orElseThrow(() -> new OrderNotFoundException(id));

        order.setStatus(status);

        return toResponse(orderRepository.save(order));
    }

    private CreateOrderResponse toResponse(CustomerOrder order) {
        List<CreateOrderResponse.Item> items = order.getItems()
            .stream()
            .map(item -> new CreateOrderResponse.Item(
                item.getProductId(),
                item.getProductName(),
                item.getUnitPrice(),
                item.getQuantity(),
                item.getSubtotal()
            ))
            .toList();

        return new CreateOrderResponse(
            order.getId(),
            order.getUserEmail(),
            order.getTotalAmount(),
            order.getStatus(),
            order.getCreatedAt(),
            items
        );
    }

    public static class OrderNotFoundException
            extends RuntimeException {
        public OrderNotFoundException(Long id) {
            super("Order not found: " + id);
        }
    }
}