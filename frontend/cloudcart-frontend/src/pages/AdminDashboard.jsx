import { useEffect, useState } from 'react';

const API_URL = 'http://localhost:8081/api/products';

const emptyProduct = {
  name: '',
  description: '',
  price: '',
  imageUrl: '',
  category: '',
  stock: '',
};

function getToken() {
  return localStorage.getItem('cloudcart_token');
}

async function apiRequest(path = '', options = {}) {
  const token = getToken();
  if (!token) throw new Error('Please log in as an admin first.');

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Request failed with status ${response.status}`);
  }
  return data;
}

function getProductImage(product) {
  return product.imageUrl || product.image_url || '';
}

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [failedImages, setFailedImages] = useState({});

  async function loadProducts() {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest();
      setProducts(Array.isArray(data) ? data : []);
      setFailedImages({});
    } catch (err) {
      setError(err.message || 'Unable to load products.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function openAddForm() {
    setEditingId(null);
    setForm({ ...emptyProduct });
    setError('');
    setNotice('');
    setFormOpen(true);
  }

  function openEditForm(product) {
    setEditingId(product.id);
    setForm({
      name: product.name ?? '',
      description: product.description ?? '',
      price: product.price ?? '',
      imageUrl: getProductImage(product),
      category: product.category ?? '',
      stock: product.stock ?? product.quantity ?? product.stockQuantity ?? '',
    });
    setError('');
    setNotice('');
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm({ ...emptyProduct });
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError('');
    setNotice('');

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      imageUrl: form.imageUrl.trim(),
      category: form.category.trim(),
      stock: Number(form.stock),
    };

    if (
      !payload.name ||
      !payload.description ||
      !payload.category ||
      !Number.isFinite(payload.price) ||
      payload.price <= 0 ||
      !Number.isInteger(payload.stock) ||
      payload.stock < 0
    ) {
      setError('Enter a name, description, category, valid price, and non-negative whole-number stock.');
      setSaving(false);
      return;
    }

    try {
      if (editingId !== null) {
        await apiRequest(`/${encodeURIComponent(editingId)}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setNotice('Product updated successfully.');
      } else {
        await apiRequest('', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setNotice('Product added successfully.');
      }
      closeForm();
      await loadProducts();
    } catch (err) {
      setError(err.message || 'Unable to save product.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product) {
    const confirmed = window.confirm(`Delete "${product.name}"? This action cannot be undone.`);
    if (!confirmed) return;

    setError('');
    setNotice('');
    try {
      await apiRequest(`/${encodeURIComponent(product.id)}`, { method: 'DELETE' });
      setProducts((current) => current.filter((item) => item.id !== product.id));
      if (editingId === product.id) closeForm();
      setNotice('Product deleted successfully.');
    } catch (err) {
      setError(err.message || 'Unable to delete product.');
    }
  }

  function handleImageError(productId) {
    setFailedImages((current) => ({ ...current, [productId]: true }));
  }

  return (
    <main className="page-shell admin-products-page">
      <header className="admin-products-header">
        <div>
          <span className="checkout-eyebrow">CLOUDCART ADMIN</span>
          <h1>Manage Products</h1>
          <p>View, update, add, and remove products from your store.</p>
        </div>
        <button type="button" className="primary-button admin-add-button" onClick={openAddForm}>
          + Add Product
        </button>
      </header>

      {error && <div className="checkout-error" role="alert">{error}</div>}
      {notice && <div className="admin-notice" role="status">{notice}</div>}

      {formOpen && (
        <section className="checkout-card admin-product-form-card">
          <div className="admin-form-header">
            <div>
              <h2>{editingId !== null ? 'Edit Product' : 'Add Product'}</h2>
              <p>{editingId !== null ? 'Update the existing product details.' : 'Enter the details for the new product.'}</p>
            </div>
            <button type="button" className="admin-close-button" onClick={closeForm} aria-label="Close product form">
              X
            </button>
          </div>

          <form onSubmit={handleSubmit} className="admin-product-form">
            <label>
              Product name
              <input name="name" value={form.name} onChange={handleChange} required maxLength={150} />
            </label>

            <label>
              Description
              <textarea name="description" value={form.description} onChange={handleChange} required rows={3} />
            </label>

            <div className="admin-form-grid">
              <label>
                Price (INR)
                <input name="price" type="number" value={form.price} onChange={handleChange} min="0.01" step="0.01" required />
              </label>
              <label>
                Stock quantity
                <input name="stock" type="number" value={form.stock} onChange={handleChange} min="0" step="1" required />
              </label>
            </div>

            <label>
              Category
              <input name="category" value={form.category} onChange={handleChange} required />
            </label>

            <label>
              Image URL
              <input
                name="imageUrl"
                type="url"
                value={form.imageUrl}
                onChange={handleChange}
                placeholder="https://example.com/product.jpg"
              />
            </label>

            {form.imageUrl.trim() && (
              <div className="admin-image-preview">
                <p>Product image preview</p>
                <img
                  key={form.imageUrl.trim()}
                  src={form.imageUrl.trim()}
                  alt="Product preview"
                  onError={(event) => { event.currentTarget.style.display = 'none'; }}
                  onLoad={(event) => { event.currentTarget.style.display = 'block'; }}
                />
              </div>
            )}

            <div className="admin-form-actions">
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? 'Saving...' : editingId !== null ? 'Update Product' : 'Save Product'}
              </button>
              <button type="button" className="admin-cancel-button" onClick={closeForm} disabled={saving}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="admin-products-section">
        <div className="admin-products-section-heading">
          <h2>Existing Products</h2>
          <span>{products.length} products</span>
        </div>

        {loading ? (
          <p className="order-loading">Loading products...</p>
        ) : products.length === 0 ? (
          <div className="checkout-card order-empty">
            <h3>No products found</h3>
            <p>Click Add Product to create your first product.</p>
          </div>
        ) : (
          <div className="admin-products-table-wrap">
            <table className="admin-products-table">
              <thead>
                <tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const imageUrl = getProductImage(product);
                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="admin-product-name">
                          {imageUrl && !failedImages[product.id] ? (
                            <img src={imageUrl} alt={product.name} onError={() => handleImageError(product.id)} />
                          ) : (
                            <div className="admin-product-placeholder">📦</div>
                          )}
                          <div><strong>{product.name}</strong><p>#{product.id}</p></div>
                        </div>
                      </td>
                      <td>{product.category || '-'}</td>
                      <td>
                        {new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                          maximumFractionDigits: 2,
                        }).format(Number(product.price || 0))}
                      </td>
                      <td>{product.stock ?? product.quantity ?? product.stockQuantity ?? '-'}</td>
                      <td>
                        <div className="admin-product-actions">
                          <button type="button" className="admin-edit-button" onClick={() => openEditForm(product)}>Edit</button>
                          <button type="button" className="admin-delete-button" onClick={() => handleDelete(product)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}