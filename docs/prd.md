# Product Requirements Document (PRD)

## 1. Product

**Name:** AgriConnect  
**Tagline:** AI-powered farming decisions with a direct farm-to-market ecosystem.

## 2. Vision

AgriConnect helps farmers decide **what to grow, when to grow it, and where to sell it** using location, weather, market and farm data.

## 3. Problem

Farmers commonly face:
- crop selection based on incomplete information;
- weather uncertainty;
- volatile market prices;
- weak visibility into demand;
- dependence on intermediaries;
- difficulty finding verified buyers.

## 4. Solution

AgriConnect combines:
- AI crop recommendation;
- weather-aware farming guidance;
- market intelligence;
- farmer crop listings;
- buyer marketplace;
- order management;
- admin verification and analytics.

## 5. Target Users

### Farmer
Needs simple recommendations, expected returns, risk information and buyer access.

### Buyer
Needs reliable supply, quantity, quality, harvest date and transparent seller information.

### Admin
Needs user verification, listing moderation and platform analytics.

## 6. Goals

1. Help farmers make data-informed crop decisions.
2. Improve market visibility.
3. Connect farmers with buyers.
4. Demonstrate an explainable AI workflow.
5. Deliver a stable, visually polished hackathon MVP.

## 7. MVP Scope

### In Scope

- Farmer registration/login
- Farmer profile
- Location/weather input
- AI crop recommendation
- Crop suitability/risk score
- Market price/trend view
- Crop listing
- Buyer marketplace
- Order/inquiry request
- Admin verification
- Basic analytics
- Responsive web UI

### Out of Scope

- Real payment settlement
- Full logistics integration
- Production-grade insurance/loan integration
- Full satellite analytics pipeline
- Large-scale multilingual voice assistant
- Real-world contract farming enforcement

## 8. Functional Requirements

### FR-01 Authentication
Users can register, log in and access role-specific functionality.

### FR-02 Farmer Profile
Farmer enters:
- location;
- land size;
- soil type;
- irrigation type;
- preferred crops;
- optional farming history.

### FR-03 Weather Analysis
System obtains or accepts:
- temperature;
- rainfall;
- humidity;
- forecast;
- season.

### FR-04 Crop Recommendation
System returns top recommended crops with:
- suitability score;
- estimated profit range;
- risk score;
- sowing guidance;
- explanation.

### FR-05 Market Intelligence
System displays:
- current/reference price;
- price trend;
- demand indicator;
- suggested selling window.

### FR-06 Crop Listing
Farmer can create a listing with:
- crop;
- quantity;
- expected harvest date;
- quality grade;
- asking price.

### FR-07 Buyer Marketplace
Buyer can:
- browse listings;
- filter by crop/location;
- inspect listing details;
- submit an order/inquiry.

### FR-08 Admin
Admin can:
- review users;
- verify accounts;
- approve/reject listings;
- view analytics.

## 9. User Stories

### Farmer

- As a farmer, I want to enter my location so the system can personalize recommendations.
- As a farmer, I want to compare crops by suitability and expected return.
- As a farmer, I want to list my crop so buyers can find it.
- As a farmer, I want to see market trends before selling.

### Buyer

- As a buyer, I want to find produce by crop and location.
- As a buyer, I want to see quantity and harvest date.
- As a buyer, I want to submit an order request.

### Admin

- As an admin, I want to verify participants.
- As an admin, I want to moderate listings.
- As an admin, I want to see marketplace activity.

## 10. Non-Functional Requirements

- Mobile-first responsive UI
- Clear navigation
- Secure authentication
- Role-based authorization
- API validation
- Graceful error handling
- Fast common interactions
- Explainable recommendations
- Demo fallback data

## 11. Acceptance Criteria

The MVP is accepted when:

- A farmer can register/login.
- A farmer can enter farm information.
- Recommendation results are generated.
- Recommendation reasoning is visible.
- A farmer can create a listing.
- A buyer can browse listings.
- A buyer can submit an order request.
- Admin can approve/reject a listing.
- Main demo journeys work without manual database intervention.

## 12. Success Metrics

- Recommendation generated within 5 seconds.
- Buyer can find a listing within 3 interactions.
- Complete farmer-to-buyer demo works end-to-end.
- No blocker bugs in the final presentation flow.
