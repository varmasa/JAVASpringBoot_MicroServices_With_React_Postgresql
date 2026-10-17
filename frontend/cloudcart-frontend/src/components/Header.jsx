import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  ShoppingCart,
  Truck,
  ChevronDown,
  LogOut,
  PackagePlus,
} from "lucide-react";
import { useCart } from "../context/CartContext.jsx";

function readSavedUser() {
  try {
    const saved = localStorage.getItem("cloudcart_user");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export default function Header() {
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const [user, setUser] = useState(readSavedUser);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function refreshUser() {
      setUser(readSavedUser());
    }

    window.addEventListener("cloudcart-auth-change", refreshUser);
    window.addEventListener("storage", refreshUser);

    return () => {
      window.removeEventListener("cloudcart-auth-change", refreshUser);
      window.removeEventListener("storage", refreshUser);
    };
  }, []);

  function handleLogout() {
    localStorage.removeItem("cloudcart_token");
    localStorage.removeItem("cloudcart_user");

    setUser(null);
    setMenuOpen(false);

    window.dispatchEvent(new Event("cloudcart-auth-change"));
    navigate("/login", { replace: true });
  }

  const displayName = user?.name || "My Account";
  const initial = displayName.charAt(0).toUpperCase();
  const isAdmin = user?.role?.toUpperCase() === "ADMIN";

  return (
    <header className="site-header">
      <div className="header-inner container">
        <Link className="brand" to="/" aria-label="CloudCart home">
          <span className="brand-mark">
            <ShoppingBag size={21} />
          </span>
          <span>
            cloud<span>cart</span>
          </span>
        </Link>

        <nav className="main-nav" aria-label="Main navigation">
          <NavLink to="/" end>
            Shop
          </NavLink>
          <NavLink to="/orders">My orders</NavLink>
        </nav>

        <div className="header-actions">
          <span className="delivery-note">
            <Truck size={16} /> Easy delivery
          </span>

          <Link
            className="cart-link"
            to="/cart"
            aria-label={`Cart, ${itemCount} items`}
          >
            <ShoppingCart size={19} />
            <span>Cart</span>
            <b>{itemCount}</b>
          </Link>

          {user ? (
            <div className="profile-wrapper">
              <button
                type="button"
                className="profile-trigger"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-label="Open user profile menu"
              >
                <span className="profile-avatar">{initial}</span>
                <span className="profile-name">{displayName}</span>
                <ChevronDown size={16} />
              </button>

              {menuOpen && (
                <>
                  <button
                    type="button"
                    className="profile-dismiss"
                    aria-label="Close profile menu"
                    onClick={() => setMenuOpen(false)}
                  />

                  <div className="profile-menu">
                    <div className="profile-details">
                      <div className="profile-menu-name">
                        {displayName}
                      </div>
                      <div className="profile-email">{user.email}</div>
                    </div>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="profile-admin-link"
                        onClick={() => setMenuOpen(false)}
                      >
                        <PackagePlus size={17} />
                        Add Products
                      </Link>
                    )}

                    <button
                      type="button"
                      className="profile-logout"
                      onClick={handleLogout}
                    >
                      <LogOut size={17} />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="header-auth-links">
              <Link to="/login">Login</Link>
              <Link className="header-signup" to="/signup">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}