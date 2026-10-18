
package com.orderservice.orderservice.service;

import com.orderservice.orderservice.dto.CartResponse;
import com.orderservice.orderservice.dto.CreateOrderResponse;
import com.orderservice.orderservice.dto.OrderPaymentVerificationRequest;
import com.orderservice.orderservice.dto.PaymentOrderResponse;
import com.orderservice.orderservice.dto.VerifyPaymentResponse;
import com.orderservice.orderservice.entity.CustomerOrder;
import com.orderservice.orderservice.entity.OrderItem;
import com.orderservice.orderservice.entity.OrderStatus;
import com.orderservice.orderservice.repository.OrderRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OrderService {

    private static final BigDecimal FREE_SHIPPING_THRESHOLD =
            new BigDecimal("1999.00");

    private static final BigDecimal SHIPPING_CHARGE =
            new BigDecimal("99.00");

    private static final String INR = "INR";

    private final OrderRepository orderRepository;
    private final RestClient restClient;

    @Value("${app.payment-service.url}")
    private String paymentServiceUrl;

    @Value("${app.payment-service.internal-secret}")
    private String paymentInternalSecret;

    @Value("${app.cart-service.url}")
    private String cartServiceUrl;

    public OrderService(
            OrderRepository orderRepository,
            RestClient.Builder builder) {

        this.orderRepository = orderRepository;
        this.restClient = builder.build();
    }

    // --------------------------------------------------
    // 1. CREATE ORDER FROM CART
    // --------------------------------------------------

    @Transactional
    public CreateOrderResponse checkout(String email, String token) {

        CartResponse cart = restClient.get()
                .uri(cartServiceUrl + "/api/cart")
                .header(
                        HttpHeaders.AUTHORIZATION,
                        "Bearer " + token
                )
                .retrieve()
                .body(CartResponse.class);

        if (cart == null
                || cart.items() == null
                || cart.items().isEmpty()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Your cart is empty"
            );
        }

        CustomerOrder order = new CustomerOrder();
        order.setUserEmail(email);
        order.setStatus(OrderStatus.PLACED);

        BigDecimal subtotal = BigDecimal.ZERO;

        for (CartResponse.CartItem cartItem : cart.items()) {

            if (cartItem.productId() == null
                    || cartItem.price() == null
                    || cartItem.quantity() == null
                    || cartItem.quantity() <= 0
                    || cartItem.price().signum() < 0) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid item found in cart"
                );
            }

            OrderItem item = new OrderItem();

            item.setProductId(cartItem.productId());
            item.setProductName(cartItem.productName());
            item.setUnitPrice(cartItem.price());
            item.setQuantity(cartItem.quantity());

            BigDecimal itemSubtotal = cartItem.price()
                    .multiply(
                            BigDecimal.valueOf(cartItem.quantity())
                    );

            item.setSubtotal(itemSubtotal);
            order.addItem(item);

            subtotal = subtotal.add(itemSubtotal);
        }

        // Shipping is calculated by the backend.
        BigDecimal shipping = subtotal.compareTo(
                FREE_SHIPPING_THRESHOLD
        ) >= 0
                ? BigDecimal.ZERO
                : SHIPPING_CHARGE;

        BigDecimal total = subtotal.add(shipping);

        order.setTotalAmount(total);

        CustomerOrder savedOrder =
                orderRepository.saveAndFlush(order);

        // Clear the cart after saving the order.
        restClient.delete()
                .uri(cartServiceUrl + "/api/cart")
                .header(
                        HttpHeaders.AUTHORIZATION,
                        "Bearer " + token
                )
                .retrieve()
                .toBodilessEntity();

        return toResponse(savedOrder);
    }

    // --------------------------------------------------
    // 2. GET CURRENT USER'S ORDERS
    // --------------------------------------------------

    @Transactional(readOnly = true)
    public List<CreateOrderResponse> getMyOrders(String email) {

        return orderRepository
                .findByUserEmailOrderByCreatedAtDesc(email)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // --------------------------------------------------
    // 3. GET ONE ORDER BELONGING TO CURRENT USER
    // --------------------------------------------------

    @Transactional(readOnly = true)
    public CreateOrderResponse getMyOrder(
            Long id,
            String email) {

        CustomerOrder order = orderRepository
                .findByIdAndUserEmail(id, email)
                .orElseThrow(() -> new OrderNotFoundException(id));

        return toResponse(order);
    }

    // --------------------------------------------------
    // 4. UPDATE ORDER STATUS
    // --------------------------------------------------

    @Transactional
    public CreateOrderResponse updateStatus(
            Long id,
            OrderStatus newStatus) {

        CustomerOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException(id));

        if (newStatus == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Order status is required"
            );
        }

        if (newStatus == OrderStatus.PLACED
                || newStatus == OrderStatus.PAYMENT_PENDING
                || newStatus == OrderStatus.PAID) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "This status cannot be set through the admin status endpoint"
            );
        }

        boolean paid = order.getStatus() == OrderStatus.PAID
                || order.getStatus() == OrderStatus.CONFIRMED
                || order.getStatus() == OrderStatus.PROCESSING
                || order.getStatus() == OrderStatus.SHIPPED
                || order.getStatus() == OrderStatus.DELIVERED;

        if (newStatus != OrderStatus.CANCELLED && !paid) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Payment must be verified before fulfilment"
            );
        }

        if (order.getStatus() == OrderStatus.CANCELLED
                || order.getStatus() == OrderStatus.DELIVERED) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This order can no longer be updated"
            );
        }

        order.setStatus(newStatus);

        return toResponse(orderRepository.save(order));
    }

    // --------------------------------------------------
    // 5. CREATE RAZORPAY ORDER
    // --------------------------------------------------

    @Transactional
    public PaymentOrderResponse createPaymentOrder(
            Long orderId,
            String email) {

        CustomerOrder order = orderRepository
                .findByIdAndUserEmail(orderId, email)
                .orElseThrow(() -> new OrderNotFoundException(orderId));

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cancelled orders cannot be paid"
            );
        }

        if (order.getStatus() == OrderStatus.PAID
                || order.getStatus() == OrderStatus.CONFIRMED
                || order.getStatus() == OrderStatus.PROCESSING
                || order.getStatus() == OrderStatus.SHIPPED
                || order.getStatus() == OrderStatus.DELIVERED) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Order is already paid or fulfilled"
            );
        }

        if (order.getTotalAmount() == null
                || order.getTotalAmount().signum() <= 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Order amount must be greater than zero"
            );
        }

        Map<String, Object> body = Map.of(
                "orderReference", order.getId().toString(),
                "amount", order.getTotalAmount()
        );

        PaymentOrderResponse response = restClient.post()
                .uri(paymentServiceUrl + "/api/payments/orders")
                .header(
                        "X-Internal-Service-Secret",
                        paymentInternalSecret
                )
                .body(body)
                .retrieve()
                .body(PaymentOrderResponse.class);

        if (response == null
                || response.razorpayOrderId() == null
                || response.keyId() == null
                || !order.getId().toString().equals(
                        response.orderReference())
                || response.amount() != order.getTotalAmount()
                        .movePointRight(2)
                        .longValueExact()
                || !INR.equals(response.currency())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Payment Service returned invalid payment details"
            );
        }

        order.setStatus(OrderStatus.PAYMENT_PENDING);
        orderRepository.save(order);

        return response;
    }

    // --------------------------------------------------
    // 6. VERIFY RAZORPAY PAYMENT
    // --------------------------------------------------

    @Transactional
    public CreateOrderResponse verifyOrderPayment(
            OrderPaymentVerificationRequest request,
            String email) {

        CustomerOrder order = orderRepository
                .findByIdAndUserEmail(request.orderId(), email)
                .orElseThrow(() ->
                        new OrderNotFoundException(request.orderId()));

        // Make repeated successful verification requests safe.
        if (order.getStatus() == OrderStatus.PAID) {
            return toResponse(order);
        }

        if (order.getStatus() != OrderStatus.PAYMENT_PENDING
                && order.getStatus() != OrderStatus.PLACED) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Order is not eligible for payment verification"
            );
        }

        Map<String, Object> body = Map.of(
                "razorpayOrderId", request.razorpayOrderId(),
                "razorpayPaymentId", request.razorpayPaymentId(),
                "razorpaySignature", request.razorpaySignature()
        );

        VerifyPaymentResponse result = restClient.post()
                .uri(paymentServiceUrl + "/api/payments/verify")
                .header(
                        "X-Internal-Service-Secret",
                        paymentInternalSecret
                )
                .body(body)
                .retrieve()
                .body(VerifyPaymentResponse.class);

        if (result == null
                || !"PAID".equalsIgnoreCase(result.status())
                || !order.getId().toString().equals(
                        result.orderReference())
                || request.razorpayOrderId() == null
                || !request.razorpayOrderId().equals(
                        result.razorpayOrderId())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Payment has not been confirmed for this order"
            );
        }

        // amount is BigDecimal, so do not convert it again.
        BigDecimal verifiedAmount = result.amount();

        if (verifiedAmount == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Payment Service returned a missing amount"
            );
        }

        String currency = result.currency();

        if (verifiedAmount.compareTo(order.getTotalAmount()) != 0
                || !INR.equalsIgnoreCase(
                        currency == null ? "" : currency)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Payment amount or currency does not match the order"
            );
        }

        order.setStatus(OrderStatus.PAID);

        return toResponse(orderRepository.save(order));
    }

    // --------------------------------------------------
    // 7. MAP ENTITY TO RESPONSE DTO
    // --------------------------------------------------

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

    // --------------------------------------------------
    // 8. ORDER NOT FOUND EXCEPTION
    // --------------------------------------------------

    public static class OrderNotFoundException
            extends RuntimeException {

        public OrderNotFoundException(Long id) {
            super("Order not found: " + id);
        }
    }
}