package com.cloudcart.cartservice.repository;

import com.cloudcart.cartservice.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    List<CartItem> findByUserEmailOrderByCreatedAtDesc(String userEmail);

    Optional<CartItem> findByUserEmailAndProductId(
        String userEmail, Long productId
    );

    void deleteByUserEmailAndProductId(String userEmail, Long productId);

    void deleteByUserEmail(String userEmail);
}