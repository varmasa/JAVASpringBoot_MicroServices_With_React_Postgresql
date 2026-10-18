
package com.cloudcart.review.controller;

import com.cloudcart.review.dto.ReviewRequest;
import com.cloudcart.review.dto.ReviewResponse;
import com.cloudcart.review.dto.ReviewSummary;
import com.cloudcart.review.service.ReviewService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "http://localhost:5173")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    public ResponseEntity<ReviewResponse> createReview(
            @Valid @RequestBody ReviewRequest request,
            Authentication authentication) {

        String userEmail = getUserEmail(authentication);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.createReview(userEmail, request));
    }

    @GetMapping("/product/{productId}")
    public List<ReviewResponse> getProductReviews(
            @PathVariable Long productId) {

        return reviewService.getReviewsByProduct(productId);
    }

    @GetMapping("/product/{productId}/summary")
    public ReviewSummary getReviewSummary(
            @PathVariable Long productId) {

        return reviewService.getReviewSummary(productId);
    }

    @GetMapping("/my")
    public List<ReviewResponse> getMyReviews(
            Authentication authentication) {

        return reviewService.getMyReviews(getUserEmail(authentication));
    }

    @PutMapping("/{reviewId}")
    public ReviewResponse updateReview(
            @PathVariable Long reviewId,
            @Valid @RequestBody ReviewRequest request,
            Authentication authentication) {

        return reviewService.updateReview(
                reviewId,
                getUserEmail(authentication),
                request
        );
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Void> deleteReview(
            @PathVariable Long reviewId,
            Authentication authentication) {

        reviewService.deleteReview(
                reviewId,
                getUserEmail(authentication)
        );

        return ResponseEntity.noContent().build();
    }

    private String getUserEmail(Authentication authentication) {

        if (authentication == null
                || authentication.getPrincipal() == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication required");
        }

        String email = authentication.getName();

        if (email == null || !email.contains("@")) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authenticated principal must contain the user's email");
        }

        return email.trim().toLowerCase();
    }
}