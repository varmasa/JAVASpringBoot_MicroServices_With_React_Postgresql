# CloudCart Frontend (Step 1)

React + Vite demo storefront for the CloudCart DevOps microservices learning project. This repository intentionally focuses on frontend and DevOps integration; it does not teach Java or Spring Boot.

## Included

- Product catalog, search, category filtering
- Cart with quantity controls and subtotal/shipping estimate
- Demo checkout with delivery form validation
- Browser-local demo order history and confirmation page
- React Router navigation
- Vite `/api` proxy for the future Spring Cloud Gateway
- Sample product fallback so the UI runs before backend services exist

## Requirements

- Node.js 20.19+ or 22.12+ recommended
- npm

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Connect to API Gateway later

The frontend expects the product endpoint at `GET /api/products`. Vite proxies `/api/*` to `http://localhost:8080` by default.

To change the target, create `.env` from `.env.example` and set:

```env
VITE_API_PROXY_TARGET=http://localhost:8080
```

Restart Vite after changing environment variables. The product API currently falls back to demo data if the API is unavailable. Cart and demo orders currently live in React state/localStorage; later steps will connect them to Cart and Order microservices.

## Build for production

```bash
npm run build
npm run preview
```

Production build output is written to `dist/`. The deployment pipeline and Dockerfile will be added in later steps.

## Current limitations (intentional for Step 1)

- No authentication yet.
- Checkout creates a local demo order only; it does not charge a payment method.
- Shipping and tracking are placeholders until Shipping Service is connected.
- Frontend totals are for display only. The backend must validate prices, stock, shipping and final totals.
- Do not use localStorage for sensitive customer data in a production implementation.
