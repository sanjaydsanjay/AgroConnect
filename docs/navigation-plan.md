# Navigation Plan

## 1. Information Architecture

```text
AgriConnect
├── Public
│   ├── Landing
│   ├── Login
│   └── Register
│
├── Farmer
│   ├── Dashboard
│   ├── AI Recommendation
│   ├── Market
│   ├── My Listings
│   ├── Orders/Requests
│   └── Notifications
│
├── Buyer
│   ├── Dashboard
│   ├── Marketplace
│   ├── Listing Details
│   ├── Orders
│   └── Farmers
│
└── Admin
    ├── Dashboard
    ├── Users
    ├── Listings
    └── Analytics
```

## 2. Routes

### Public

| Route | Screen |
|---|---|
| `/` | Landing |
| `/login` | Login |
| `/register` | Registration |

### Farmer

| Route | Screen |
|---|---|
| `/farmer/dashboard` | Farmer dashboard |
| `/farmer/recommend` | AI crop recommendation |
| `/farmer/market` | Market intelligence |
| `/farmer/listings` | My crop listings |
| `/farmer/listings/new` | Create listing |
| `/farmer/orders` | Buyer requests |
| `/farmer/notifications` | Notifications |

### Buyer

| Route | Screen |
|---|---|
| `/buyer/dashboard` | Buyer dashboard |
| `/buyer/marketplace` | Crop marketplace |
| `/buyer/listings/:id` | Listing details |
| `/buyer/orders` | Orders |
| `/buyer/farmers` | Farmer directory |

### Admin

| Route | Screen |
|---|---|
| `/admin/dashboard` | Admin dashboard |
| `/admin/users` | User verification |
| `/admin/listings` | Listing moderation |
| `/admin/analytics` | Platform analytics |

## 3. Primary User Flows

### Farmer Flow

```text
Landing
  ↓
Register/Login
  ↓
Farmer Dashboard
  ↓
Farm Profile
  ↓
Location + Weather
  ↓
AI Recommendation
  ↓
Compare Top 3 Crops
  ↓
Select Crop
  ↓
Create Listing
  ↓
Track Buyer Requests
```

### Buyer Flow

```text
Login
  ↓
Buyer Dashboard
  ↓
Marketplace
  ↓
Filter Crop
  ↓
Listing Details
  ↓
Farmer Details
  ↓
Order / Inquiry
  ↓
Order Status
```

### Admin Flow

```text
Admin Login
  ↓
Dashboard
  ↓
Pending Users
  ↓
Verify User
  ↓
Pending Listings
  ↓
Approve / Reject
  ↓
Analytics
```

## 4. Navigation Principles

- Role-specific navigation.
- Maximum 5–6 primary navigation items.
- Strong primary CTA.
- Mobile bottom navigation for farmer/buyer if appropriate.
- Persistent status feedback.
- Avoid deep navigation.
- Every critical flow should have a clear back action.
