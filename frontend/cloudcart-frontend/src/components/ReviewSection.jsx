
import { useCallback, useEffect, useState } from "react";
import {
  createReview,
  getProductReviews,
  getReviewSummary,
} from "../services/reviewApi";
import "./ReviewSection.css";

export default function ReviewSection({ productId, onReviewsChanged }) {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({
    averageRating: 0,
    totalReviews: 0,
  });
  const [reviewerName, setReviewerName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [reviewData, summaryData] = await Promise.all([
        getProductReviews(productId),
        getReviewSummary(productId),
      ]);

      setReviews(Array.isArray(reviewData) ? reviewData : []);
      setSummary({
        averageRating: Number(summaryData?.averageRating) || 0,
        totalReviews: Number(
          summaryData?.totalReviews ?? summaryData?.reviewCount
        ) || 0,
      });
    } catch (err) {
      setError(err.message || "Unable to load reviews.");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!localStorage.getItem("cloudcart_token")) {
      setError("Please log in before submitting a review.");
      return;
    }

    if (!reviewerName.trim()) {
      setError("Please enter your display name.");
      return;
    }

    if (!comment.trim()) {
      setError("Please enter a comment.");
      return;
    }

    try {
      setSubmitting(true);

      await createReview({
        productId,
        reviewerName: reviewerName.trim(),
        rating,
        comment: comment.trim(),
      });

      setComment("");
      setRating(5);
      setMessage("Your review was submitted successfully.");

      await loadReviews();
      onReviewsChanged?.();
    } catch (err) {
      setError(err.message || "Unable to submit your review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="review-section">
      <h3>Customer Reviews</h3>

      <div className="review-summary">
        {summary.totalReviews > 0 ? (
          <>
            <span className="review-average">
              ★ {summary.averageRating.toFixed(1)}
            </span>
            <span>
              ({summary.totalReviews}{" "}
              {summary.totalReviews === 1 ? "review" : "reviews"})
            </span>
          </>
        ) : (
          <span>No ratings yet</span>
        )}
      </div>

      <form className="review-form" onSubmit={handleSubmit}>
        <label htmlFor={`reviewer-${productId}`}>
          Your name
        </label>
        <input
          id={`reviewer-${productId}`}
          value={reviewerName}
          onChange={(event) => setReviewerName(event.target.value)}
          placeholder="Enter your display name"
          maxLength={100}
          required
          disabled={submitting}
        />

        <label htmlFor={`rating-${productId}`}>
          Your rating
        </label>
        <select
          id={`rating-${productId}`}
          value={rating}
          onChange={(event) => setRating(Number(event.target.value))}
          disabled={submitting}
        >
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value} star{value !== 1 ? "s" : ""}
            </option>
          ))}
        </select>

        <label htmlFor={`comment-${productId}`}>
          Your comment
        </label>
        <textarea
          id={`comment-${productId}`}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Share your experience with this product..."
          maxLength={2000}
          required
          rows={3}
          disabled={submitting}
        />

        <button type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </form>

      {error && (
        <p className="review-error" role="alert">{error}</p>
      )}

      {message && (
        <p className="review-success" role="status">{message}</p>
      )}

      <div className="review-list">
        <h4>What customers say</h4>

        {loading ? (
          <p>Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p>No reviews yet. Be the first to review this product!</p>
        ) : (
          reviews.map((review) => (
            <article className="review-item" key={review.id}>
              <div className="reviewer-details">
                <strong className="reviewer-name">
                  {review.reviewerName || "Customer"}
                </strong>
                <span className="reviewer-stars" aria-label={`${review.rating} out of 5 stars`}>
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </span>
              </div>

              <div className="review-item-heading">
                <span>
                  {review.createdAt
                    ? new Date(review.createdAt).toLocaleDateString()
                    : ""}
                </span>
              </div>

              <p>{review.comment}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}