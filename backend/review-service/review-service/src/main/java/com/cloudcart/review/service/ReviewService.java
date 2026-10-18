
package com.cloudcart.review.service;

import com.cloudcart.review.dto.ReviewRequest;
import com.cloudcart.review.dto.ReviewResponse;
import com.cloudcart.review.dto.ReviewSummary;
import com.cloudcart.review.model.Review;
import com.cloudcart.review.repository.ReviewRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;

    public ReviewService(ReviewRepository reviewRepository) {
        this.reviewRepository = reviewRepository;
    }

    // Create a new review
    @Transactional
    public ReviewResponse createReview(
            String userEmail,
            ReviewRequest request) {

        if (userEmail == null || userEmail.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please log in to submit a review."
            );
        }

        if (reviewRepository.existsByProductIdAndUserEmail(
                request.getProductId(), userEmail)) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "You have already reviewed this product. Each user can submit only one review per product."
            );
        }

        Review review = new Review();
        review.setProductId(request.getProductId());
        review.setUserEmail(userEmail);
        review.setRating(request.getRating());
        review.setComment(request.getComment());

        Review savedReview = reviewRepository.save(review);

        return toResponse(savedReview);
    }

    // Get all reviews for a product
    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsByProduct(Long productId) {
        return reviewRepository
                .findByProductIdOrderByCreatedAtDesc(productId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // Get average rating and total review count
    @Transactional(readOnly = true)
    public ReviewSummary getReviewSummary(Long productId) {

        Double average = reviewRepository
                .findAverageRatingByProductId(productId);

        Long count = reviewRepository.countByProductId(productId);

        double averageRating = average == null
                ? 0.0
                : Math.round(average * 100.0) / 100.0;

        return new ReviewSummary(productId, averageRating, count);
    }

    // Get reviews belonging to the logged-in user
    @Transactional(readOnly = true)
    public List<ReviewResponse> getMyReviews(String userEmail) {
        return reviewRepository
                .findByUserEmailOrderByCreatedAtDesc(userEmail)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // Update an existing review
    @Transactional
    public ReviewResponse updateReview(
            Long reviewId,
            String userEmail,
            ReviewRequest request) {

        Review review = getReviewOrThrow(reviewId);

        verifyOwner(review, userEmail);

        if (!review.getProductId().equals(request.getProductId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Product ID cannot be changed."
            );
        }

        review.setRating(request.getRating());
        review.setComment(request.getComment());

        return toResponse(reviewRepository.save(review));
    }

    // Delete an existing review
    @Transactional
    public void deleteReview(Long reviewId, String userEmail) {

        Review review = getReviewOrThrow(reviewId);

        verifyOwner(review, userEmail);

        reviewRepository.delete(review);
    }

    private Review getReviewOrThrow(Long reviewId) {
        return reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Review not found."
                ));
    }

    // Users can modify only their own reviews
    private void verifyOwner(Review review, String userEmail) {

        if (review.getUserEmail() == null
                || userEmail == null
                || !review.getUserEmail().equalsIgnoreCase(userEmail)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can modify only your own reviews."
            );
        }
    }

    private ReviewResponse toResponse(Review review) {
        return new ReviewResponse(
                review.getId(),
                review.getProductId(),
                review.getUserEmail(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt(),
                review.getUpdatedAt()
        );
    }
}