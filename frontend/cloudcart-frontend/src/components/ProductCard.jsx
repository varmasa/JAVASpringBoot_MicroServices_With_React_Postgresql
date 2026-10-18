
import { Check, Plus, Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useCart } from "../context/CartContext.jsx";
import { getReviewSummary } from "../services/reviewApi";
import ReviewSection from "./ReviewSection";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [summary, setSummary] = useState({
    averageRating: 0,
    totalReviews: 0,
  });

  const imageUrl = product.imageUrl || product.image_url || "";

  const loadSummary = useCallback(async () => {
    try {
      const data = await getReviewSummary(product.id);

      setSummary({
        averageRating: Number(data?.averageRating) || 0,
        totalReviews: Number(
          data?.totalReviews ?? data?.reviewCount
        ) || 0,
      });
    } catch (err) {
      console.error("Unable to load product rating:", err);
    }
  }, [product.id]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const image =
    imageUrl && !imageFailed ? (
      <img
        src={imageUrl}
        alt={product.name}
        className="product-image"
        onError={() => setImageFailed(true)}
      />
    ) : (
      <span aria-hidden="true">{product.image || "📦"}</span>
    );

  async function handleAdd() {
    try {
      await addItem(product);
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1100);
    } catch {
      // CartContext already records the error.
    }
  }

  const stock =
    product.stock ?? product.stockQuantity ?? product.quantity;

  return (
    <article className="product-card">
      <div className={`product-art art-${String(product.id).slice(-1)}`}>
        {image}
      </div>

      <div className="product-info">
        <div className="product-meta">
          <span>{product.category || "Essentials"}</span>
        </div>

        <div className="product-rating-summary">
          {summary.totalReviews > 0 ? (
            <>
              <Star size={14} fill="currentColor" />
              <strong>{summary.averageRating.toFixed(1)}</strong>
              <span>
                ({summary.totalReviews}{" "}
                {summary.totalReviews === 1 ? "review" : "reviews"})
              </span>
            </>
          ) : (
            <span>No ratings yet</span>
          )}
        </div>

        <h3>{product.name}</h3>

        <p className="product-description">
          {product.description ||
            "A customer favourite, made for everyday use."}
        </p>

        <div className="product-bottom">
          <strong>{money(Number(product.price) || 0)}</strong>

          <button
            className={`add-button ${added ? "added" : ""}`}
            onClick={handleAdd}
            disabled={stock === 0}
          >
            {stock === 0
              ? "Sold out"
              : added
                ? <><Check size={16} /> Added</>
                : <><Plus size={16} /> Add</>}
          </button>
        </div>

        <details className="product-reviews">
          <summary>
            <Star size={15} />
            Ratings & Reviews
          </summary>

          <ReviewSection
            productId={product.id}
            onReviewsChanged={loadSummary}
          />
        </details>
      </div>
    </article>
  );
}