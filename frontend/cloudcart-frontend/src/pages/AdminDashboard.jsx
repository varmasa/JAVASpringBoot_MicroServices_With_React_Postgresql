
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Package,
  PackagePlus,
  Boxes,
  Search,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  ArrowUpRight,
  Warehouse,
} from "lucide-react";

const API_URL = "http://localhost:8081/api/products";
const LOW_STOCK_LIMIT = 5;

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  stock: "",
};

function getErrorMessage(error) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

export default function AdminDashboard() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const loadProducts = useCallback(async () => {
    setFetching(true);

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(
          `Could not load products (HTTP ${response.status}).`
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Unexpected product data received from the server.");
      }

      setProducts(data);
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(error),
      });
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return products;

    return products.filter((product) =>
      [product.name, product.description, String(product.id)]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [products, search]);

  const lowStockCount = products.filter(
    (product) => Number(product.stock) <= LOW_STOCK_LIMIT
  ).length;

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage(null);

    const token = localStorage.getItem("cloudcart_token");
    const name = form.name.trim();
    const price = Number(form.price);
    const stock = Number(form.stock);

    if (!token) {
      setMessage({
        type: "error",
        text: "Please log in again before adding a product.",
      });
      return;
    }

    if (!name || !Number.isFinite(price) || price < 0.01) {
      setMessage({
        type: "error",
        text: "Enter a product name and a price greater than zero.",
      });
      return;
    }

    if (
      form.stock.trim() === "" ||
      !Number.isSafeInteger(stock) ||
      stock < 0
    ) {
      setMessage({
        type: "error",
        text: "Stock must be a non-negative whole number.",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description: form.description.trim(),
          price,
          stock,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Your session has expired. Please sign in again."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "Admin access denied. Verify your ADMIN role and sign in again."
          );
        }

        throw new Error(
          `Product creation failed (HTTP ${response.status}).`
        );
      }

      const product = await response.json();

      setForm(EMPTY_FORM);
      setMessage({
        type: "success",
        text: `"${product.name || name}" was added successfully.`,
      });

      await loadProducts();
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell container admin-dashboard">
      <div className="admin-topbar">
        <div>
          <div className="eyebrow">
            <span className="admin-status-dot" />
            STORE MANAGEMENT
          </div>

          <h1 className="admin-heading">Admin Dashboard</h1>

          <p className="admin-subtitle">
            Manage your inventory and keep your CloudCart store up to date.
          </p>
        </div>

        <span className="admin-badge">
          <Warehouse size={15} />
          Administrator
        </span>
      </div>

      <section className="admin-stats" aria-label="Inventory summary">
        <article className="admin-stat-card">
          <div className="admin-stat-icon stat-icon-green">
            <Package size={21} />
          </div>

          <div className="admin-stat-content">
            <span>Total products</span>
            <strong>{fetching ? "—" : products.length}</strong>
            <small>Products in your catalog</small>
          </div>

          <ArrowUpRight className="admin-stat-decoration" size={18} />
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-icon stat-icon-orange">
            <Boxes size={21} />
          </div>

          <div className="admin-stat-content">
            <span>Low-stock products</span>
            <strong>{fetching ? "—" : lowStockCount}</strong>
            <small>Stock of {LOW_STOCK_LIMIT} or less</small>
          </div>

          <ArrowUpRight className="admin-stat-decoration" size={18} />
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-icon stat-icon-cream">
            <IndianRupee size={21} />
          </div>

          <div className="admin-stat-content">
            <span>Inventory units</span>
            <strong>
              {fetching
                ? "—"
                : products
                    .reduce(
                      (total, product) => total + (Number(product.stock) || 0),
                      0
                    )
                    .toLocaleString("en-IN")}
            </strong>
            <small>Total units in stock</small>
          </div>

          <ArrowUpRight className="admin-stat-decoration" size={18} />
        </article>
      </section>

      {message && (
        <div
          className={`admin-notice ${
            message.type === "success"
              ? "admin-notice-success"
              : "admin-notice-error"
          }`}
          role="status"
        >
          {message.type === "success" ? (
            <CheckCircle2 size={19} />
          ) : (
            <AlertCircle size={19} />
          )}

          <span>{message.text}</span>

          <button
            type="button"
            className="admin-notice-close"
            onClick={() => setMessage(null)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}

      <div className="admin-workspace">
        <section className="admin-panel admin-create-panel">
          <div className="admin-panel-heading">
            <div className="admin-panel-icon">
              <PackagePlus size={20} />
            </div>

            <div>
              <h2>Add a product</h2>
              <p>Introduce something new to your store.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="admin-product-form">
            <div className="admin-field">
              <label htmlFor="name">Product name <span>*</span></label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                maxLength={200}
                placeholder="e.g. Wireless Headphones"
              />
            </div>

            <div className="admin-field">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                maxLength={2000}
                rows={4}
                placeholder="Describe the product and its features..."
              />
            </div>

            <div className="admin-form-row">
              <div className="admin-field">
                <label htmlFor="price">Price <span>*</span></label>

                <div className="admin-input-with-prefix">
                  <span>₹</span>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                    required
                    placeholder="999.00"
                  />
                </div>
              </div>

              <div className="admin-field">
                <label htmlFor="stock">Stock quantity <span>*</span></label>
                <input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={handleChange}
                  required
                  placeholder="25"
                />
              </div>
            </div>

            <div className="admin-form-hint">
              <span>*</span> Required fields
            </div>

            <button
              type="submit"
              className="admin-submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="admin-spin" size={17} />
                  Adding product...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Add product
                </>
              )}
            </button>
          </form>
        </section>

        <section className="admin-panel admin-inventory-panel">
          <div className="admin-inventory-heading">
            <div>
              <h2>Product inventory</h2>
              <p>View and search your existing products.</p>
            </div>

            <button
              type="button"
              className="admin-refresh-button"
              onClick={loadProducts}
              disabled={fetching}
              aria-label="Refresh product inventory"
              title="Refresh inventory"
            >
              <RefreshCw
                size={17}
                className={fetching ? "admin-spin" : ""}
              />
            </button>
          </div>

          <div className="admin-inventory-tools">
            <div className="admin-search">
              <Search size={17} />
              <input
                type="search"
                aria-label="Search products"
                placeholder="Search products..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <span className="admin-result-count">
              {fetching ? "Loading..." : `${filteredProducts.length} items`}
            </span>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {!fetching && filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={4}>
                      <div className="admin-empty-state">
                        <Package size={29} />
                        <strong>
                          {search ? "No matching products" : "No products yet"}
                        </strong>
                        <span>
                          {search
                            ? "Try a different search term."
                            : "Add your first product using the form."}
                        </span>
                      </div>
                    </td>
                  </tr>
                )}

                {filteredProducts.map((product) => {
                  const stock = Number(product.stock) || 0;
                  const isLowStock = stock <= LOW_STOCK_LIMIT;

                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="admin-product-cell">
                          <div className="admin-product-icon">
                            <Package size={18} />
                          </div>

                          <div className="admin-product-name">
                            <strong>{product.name}</strong>
                            <span>
                              {product.description || `Product #${product.id}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="admin-price-cell">
                        {formatPrice(product.price)}
                      </td>

                      <td>{stock}</td>

                      <td>
                        <span
                          className={`admin-stock-badge ${
                            isLowStock ? "is-low-stock" : "is-in-stock"
                          }`}
                        >
                          <span />
                          {stock === 0
                            ? "Out of stock"
                            : isLowStock
                              ? "Low stock"
                              : "In stock"}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {fetching && products.length === 0 && (
                  <tr>
                    <td colSpan={4}>
                      <div className="admin-empty-state">
                        <RefreshCw className="admin-spin" size={24} />
                        <span>Loading product inventory...</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-inventory-footer">
            <span>
              <span className="admin-status-dot" />
              Connected to Product Service
            </span>
            <span>Updates after successful product creation</span>
          </div>
        </section>
      </div>
    </main>
  );
}
