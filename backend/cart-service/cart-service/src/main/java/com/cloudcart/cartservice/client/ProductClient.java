package com.cloudcart.cartservice.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.List;

@Component
public class ProductClient {

    private final RestClient restClient;

    public ProductClient(
        RestClient.Builder builder,
        @Value("${app.product-service.url}") String productServiceUrl
    ) {
        this.restClient = builder.baseUrl(productServiceUrl).build();
    }

    public ProductResponse getProduct(Long productId) {
        List<ProductResponse> products = restClient.get()
            .uri("/api/products")
            .retrieve()
            .body(new ParameterizedTypeReference<List<ProductResponse>>() {});

        if (products == null) {
            throw new IllegalStateException(
                "Product Service returned an empty response"
            );
        }

        return products.stream()
            .filter(product -> product.id() != null
                && product.id().equals(productId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException(
                "Product not found: " + productId
            ));
    }

    public record ProductResponse(
        Long id,
        String name,
        String description,
        BigDecimal price,
        Integer stock
    ) {}
}