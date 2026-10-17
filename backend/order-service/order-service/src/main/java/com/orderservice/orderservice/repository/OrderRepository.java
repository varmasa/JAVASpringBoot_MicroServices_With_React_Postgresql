package com.orderservice.orderservice.repository;

import com.orderservice.orderservice.entity.CustomerOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrderRepository
        extends JpaRepository<CustomerOrder, Long> {

    List<CustomerOrder> findByUserEmailOrderByCreatedAtDesc(
        String userEmail
    );

    Optional<CustomerOrder> findByIdAndUserEmail(
        Long id,
        String userEmail
    );
}