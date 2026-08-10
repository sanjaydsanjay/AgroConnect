# Technical Requirements Document (TRD)

## 1. Architecture

AgriConnect uses a modular three-layer architecture:

```text
Web Client
   |
   v
REST API / Application Server
   |
   +--> Authentication
   +--> Farmer Service
   +--> Recommendation Service
   +--> Market Service
   +--> Marketplace Service
   +--> Admin Service
   |
   v
PostgreSQL
   |
   +--> Weather API
   +--> Market Data
```

## 2. Recommended Stack

### Frontend
- Next.js / React
- TypeScript
- Tailwind CSS
- shadcn/ui or equivalent
- Recharts

### Backend
- FastAPI + Python
- REST API
- JWT authentication

### Database
- PostgreSQL
- Supabase/Neon optional for hosted PostgreSQL

### AI/Data
- Python
- pandas
- scikit-learn
- XGBoost or weighted scoring
- Optional time-series model for price trend

### External APIs
- Weather API
- Geolocation/maps API
- Market-price dataset/API where available

### Deployment
- Vercel/Netlify for frontend
- Render/Railway for backend
- Managed PostgreSQL

## 3. Core Services

### Authentication Service
Responsibilities:
- registration;
- login;
- token validation;
- role authorization.

### Farmer Service
Responsibilities:
- profile management;
- farm data;
- recommendations;
- crop listings.

### Recommendation Service
Inputs:
- latitude/longitude;
- season;
- weather;
- soil;
- irrigation;
- market demand;
- historical/reference crop information.

Outputs:
- ranked crops;
- suitability score;
- risk score;
- estimated profit range;
- explanation.

### Market Service
Responsibilities:
- prices;
- trends;
- demand indicators;
- market insights.

### Marketplace Service
Responsibilities:
- listings;
- search/filter;
- buyer inquiries;
- order requests.

### Admin Service
Responsibilities:
- verification;
- moderation;
- analytics.

## 4. Database Schema

### users

| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| name | string | User name |
| email/phone | string | Login identifier |
| password_hash | string | Hashed password |
| role | enum | farmer/buyer/admin |
| created_at | timestamp | Creation time |

### farmer_profiles

| Field | Type |
|---|---|
| id | UUID |
| user_id | UUID |
| village | string |
| district | string |
| state | string |
| latitude | decimal |
| longitude | decimal |
| land_size | decimal |
| soil_type | string |
| irrigation_type | string |

### crop_recommendations

| Field | Type |
|---|---|
| id | UUID |
| user_id | UUID |
| crop_name | string |
| suitability_score | decimal |
| profit_estimate | decimal |
| risk_score | decimal |
| reasoning | text |
| created_at | timestamp |

### market_prices

| Field | Type |
|---|---|
| id | UUID |
| crop_name | string |
| market_name | string |
| district | string |
| price | decimal |
| trend | string |
| updated_at | timestamp |

### crop_listings

| Field | Type |
|---|---|
| id | UUID |
| farmer_id | UUID |
| crop_name | string |
| quantity | decimal |
| harvest_date | date |
| asking_price | decimal |
| quality_grade | string |
| status | string |

### buyer_orders

| Field | Type |
|---|---|
| id | UUID |
| buyer_id | UUID |
| listing_id | UUID |
| quantity | decimal |
| offer_price | decimal |
| status | string |
| created_at | timestamp |

## 5. API Contract

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Farmer

```http
GET  /api/farmer/dashboard
POST /api/farmer/profile
POST /api/farmer/recommendation
POST /api/farmer/listings
GET  /api/farmer/listings
```

### Market

```http
GET /api/market/prices
GET /api/market/trends
GET /api/market/demand
```

### Buyer

```http
GET  /api/buyer/listings
GET  /api/buyer/listings/:id
POST /api/buyer/orders
GET  /api/buyer/orders
```

### Admin

```http
GET  /api/admin/users
GET  /api/admin/listings
POST /api/admin/users/:id/verify
POST /api/admin/listings/:id/approve
POST /api/admin/listings/:id/reject
GET  /api/admin/analytics
```

## 6. Recommendation Algorithm

Use a hybrid approach appropriate for a hackathon.

### Inputs

- rainfall suitability;
- temperature suitability;
- humidity;
- season;
- soil compatibility;
- irrigation availability;
- demand;
- price trend.

### Example Weighted Score

```text
Final Score =
  25% Weather Suitability
+ 20% Soil Compatibility
+ 15% Water Availability
+ 15% Market Demand
+ 15% Price Trend
+ 10% Seasonal Fit
```

Normalize each component to 0–100.

### Output

```json
{
  "crop": "Tomato",
  "score": 86,
  "risk": 24,
  "profit_range": "₹45,000–₹65,000",
  "reasoning": [
    "Temperature is suitable",
    "Expected rainfall is adequate",
    "Local demand is high"
  ]
}
```

## 7. Security

- Password hashing
- JWT/session validation
- Role-based authorization
- Request validation
- Rate limiting where practical
- Secrets stored in environment variables
- No API keys committed to Git

## 8. Error Handling

Frontend:
- loading states;
- empty states;
- retry actions;
- human-readable errors.

Backend:
- structured error responses;
- logging;
- validation;
- safe exception handling.

## 9. Testing

### Unit Tests
- scoring functions;
- validators;
- price calculations.

### API Tests
- auth;
- recommendations;
- listings;
- orders.

### Integration Tests
- farmer → recommendation;
- farmer → listing;
- buyer → order;
- admin → approval.

### Manual QA
- mobile;
- desktop;
- slow network;
- invalid forms;
- role access.

## 10. Deployment Requirements

Production-like demo environment:

```text
Frontend -> Vercel/Netlify
Backend  -> Render/Railway
Database -> PostgreSQL/Supabase/Neon
```

Maintain a `.env.example` and documented setup steps.
