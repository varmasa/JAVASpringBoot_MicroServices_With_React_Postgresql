
package com.cloudcart.review.repository;

import com.cloudcart.review.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByProductIdOrderByCreatedAtDesc(Long productId);

    List<Review> findByUserEmailOrderByCreatedAtDesc(String userEmail);

    boolean existsByProductIdAndUserEmail(
            Long productId,
            String userEmail
    );

    long countByProductId(Long productId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.productId = :productId")
    Double findAverageRatingByProductId(
            @Param("productId") Long productId
    );
}