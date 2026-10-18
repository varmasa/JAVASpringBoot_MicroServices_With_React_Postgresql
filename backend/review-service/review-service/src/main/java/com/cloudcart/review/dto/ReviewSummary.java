package com.cloudcart.review.dto;

public class ReviewSummary {

    private Long productId;
    private Double averageRating;
    private Long totalReviews;

    public ReviewSummary() {
    }

    public ReviewSummary(
            Long productId,
            Double averageRating,
            Long totalReviews) {
        this.productId = productId;
        this.averageRating = averageRating;
        this.totalReviews = totalReviews;
    }

    public Long getProductId() {
        return productId;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public Long getTotalReviews() {
        return totalReviews;
    }
}