
import { Link, Route, Routes } from "react-router-dom";

import Header from "./components/Header.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import ShopPage from "./pages/ShopPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";
import OrderSuccessPage from "./pages/OrderSuccessPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";

function NotFound() {
  return (
    <main className="page-shell container">
      <h1>Page not found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <Link className="primary-button" to="/">
        Go to shop
      </Link>
    </main>
  );
}

function ProtectedPage({ children }) {
  return (
    <ProtectedRoute>
      <>
        <Header />
        {children}
      </>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedPage>
              <ShopPage />
            </ProtectedPage>
          }
        />

        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route
            path="/order-success/:orderId"
            element={<OrderSuccessPage />}
        />
          
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <>
                <Header />
                <AdminDashboard />
              </>
            </AdminRoute>
          }
        />

        <Route
          path="/cart"
          element={
            <ProtectedPage>
              <CartPage />
            </ProtectedPage>
          }
        />

        <Route
          path="/checkout"
          element={
            <ProtectedPage>
              <CheckoutPage />
            </ProtectedPage>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedPage>
              <OrdersPage />
            </ProtectedPage>
          }
        />

        <Route
          path="/order-success/:orderId"
          element={
            <ProtectedPage>
              <OrderSuccessPage />
            </ProtectedPage>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}