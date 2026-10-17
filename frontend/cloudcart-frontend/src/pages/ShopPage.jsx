import { Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import { getProducts } from '../services/productApi.js';

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getProducts().then(result => { if (active) setProducts(result); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const categories = ['All', ...new Set(products.map(product => product.category).filter(Boolean))];
  const filtered = useMemo(() => products.filter(product => {
    const matchesQuery = `${product.name} ${product.description ?? ''} ${product.category ?? ''}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (category === 'All' || product.category === category);
  }), [products, query, category]);

  return (
    <main>
      <section className="hero container">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={15} /> YOUR EVERYDAY MARKETPLACE</div>
          <h1>Good finds.<br /><span>Better everyday.</span></h1>
          <p>Useful things, thoughtful picks, and little upgrades for your daily routine.</p>
          <a className="primary-button" href="#products">Explore products <span>↘</span></a>
          <div className="hero-proof"><span className="proof-dot" /> Demo store · Microservices-ready frontend</div>
        </div>
        <div className="hero-visual" aria-label="Featured products illustration">
          <div className="sun-shape" />
          <div className="floating-card card-headphones"><span>🎧</span><small>Sound, simplified</small></div>
          <div className="floating-card card-shoes"><span>👟</span><small>Move every day</small></div>
          <div className="floating-card card-mug"><span>☕</span><small>Take a moment</small></div>
          <div className="hero-caption">CURATED FOR YOUR DAY <span>✳</span></div>
        </div>
      </section>

      <section id="products" className="catalog container">
        <div className="section-heading">
          <div><div className="eyebrow">THE COLLECTION</div><h2>Shop everyday favourites</h2><p>Discover something useful for your day.</p></div>
          <div className="catalog-count"><span>{filtered.length.toString().padStart(2, '0')}</span> products</div>
        </div>
        <div className="catalog-tools">
          <label className="search-box"><Search size={18} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search products..." aria-label="Search products" /></label>
          <div className="category-filter"><SlidersHorizontal size={16} />{categories.map(item => <button key={item} onClick={() => setCategory(item)} className={category === item ? 'selected' : ''}>{item}</button>)}</div>
        </div>
        {loading ? <div className="empty-state">Loading products…</div> : filtered.length ? <div className="product-grid">{filtered.map(product => <ProductCard key={product.id} product={product} />)}</div> : <div className="empty-state">No products match that search. Try another term.</div>}
      </section>
      <section className="service-strip container"><div><span>✦</span><b>Useful picks</b><small>Made for everyday life</small></div><div><span>↗</span><b>Simple checkout</b><small>A smooth shopping flow</small></div><div><span>⌁</span><b>Track your order</b><small>Delivery updates in one place</small></div></section>
    </main>
  );
}
