package com.cloudcart.product.repository;

import com.cloudcart.product.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository
        extends JpaRepository<Product, Long> {
}