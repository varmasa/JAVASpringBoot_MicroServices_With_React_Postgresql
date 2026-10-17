package com.cloudcart.cartservice.service;

import com.cloudcart.cartservice.client.ProductClient;
import com.cloudcart.cartservice.client.ProductClient.ProductResponse;
import com.cloudcart.cartservice.dto.*;
import com.cloudcart.cartservice.entity.CartItem;
import com.cloudcart.cartservice.repository.CartItemRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class CartService {

    private final CartItemRepository repository;
    private final ProductClient productClient;

    public CartService(
        CartItemRepository repository,
        ProductClient productClient
    ) {
        this.repository = repository;
        this.productClient = productClient;
    }

    @Transactional
    public CartResponse addItem(
        String email, AddCartItemRequest request
    ) {
        ProductResponse product =
            productClient.getProduct(request.productId());

        validateStock(product, request.quantity());

        CartItem item = repository
            .findByUserEmailAndProductId(email, product.id())
            .orElse(null);

        int newQuantity = request.quantity();

        if (item == null) {
            item = new CartItem();
            item.setUserEmail(email);
            item.setProductId(product.id());
            item.setProductName(product.name());
            item.setPrice(product.price());
        } else {
            newQuantity += item.getQuantity();
            item.setProductName(product.name());
            item.setPrice(product.price());
        }

        validateStock(product, newQuantity);
        item.setQuantity(newQuantity);
        repository.save(item);

        return getCart(email);
    }

    @Transactional(readOnly = true)
    public CartResponse getCart(String email) {
        List<CartItemResponse> items =
            repository.findByUserEmailOrderByCreatedAtDesc(email)
                .stream()
                .map(item -> new CartItemResponse(
                    item.getProductId(),
                    item.getProductName(),
                    item.getPrice(),
                    item.getQuantity(),
                    item.getPrice().multiply(
                        BigDecimal.valueOf(item.getQuantity())
                    )
                ))
                .toList();

        int totalItems = items.stream()
            .mapToInt(CartItemResponse::quantity)
            .sum();

        BigDecimal totalPrice = items.stream()
            .map(CartItemResponse::subtotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new CartResponse(items, totalItems, totalPrice);
    }

    @Transactional
    public CartResponse updateItem(
        String email,
        Long productId,
        UpdateCartItemRequest request
    ) {
        CartItem item = repository
            .findByUserEmailAndProductId(email, productId)
            .orElseThrow(() -> new IllegalArgumentException(
                "Product is not in your cart"
            ));

        ProductResponse product = productClient.getProduct(productId);
        validateStock(product, request.quantity());

        item.setQuantity(request.quantity());
        item.setProductName(product.name());
        item.setPrice(product.price());

        repository.save(item);
        return getCart(email);
    }

    @Transactional
    public CartResponse removeItem(String email, Long productId) {
        if (repository.findByUserEmailAndProductId(email, productId)
                .isEmpty()) {
            throw new IllegalArgumentException(
                "Product is not in your cart"
            );
        }

        repository.deleteByUserEmailAndProductId(email, productId);
        return getCart(email);
    }

    @Transactional
    public void clearCart(String email) {
        repository.deleteByUserEmail(email);
    }

    private void validateStock(
        ProductResponse product, int quantity
    ) {
        if (product.price() == null
            || product.price().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException(
                "Product has an invalid price"
            );
        }

        if (product.stock() == null
            || product.stock() < quantity) {
            throw new IllegalArgumentException(
                "Insufficient stock for " + product.name()
            );
        }
    }
}