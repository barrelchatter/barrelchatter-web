# Pricing Intelligence Feature

> Community-driven pricing data and deal analysis for bourbon collectors.

---

## Overview

The Pricing Intelligence system aggregates anonymized purchase data from the BarrelChatter community to provide collectors with market insights including average prices, regional variations, and deal quality indicators.

---

## Features

### Community Pricing Data

- **Average Price Paid**: Aggregated from all user purchases
- **Price Range**: Min/max prices reported by community
- **Sample Size**: Number of data points for confidence
- **Regional Breakdown**: Prices by state (Phase 2+)

### Deal Analysis

Real-time deal quality assessment when logging purchases:

| Deal Rating | Criteria | Badge Color |
|-------------|----------|-------------|
| Great Deal | ≤85% of avg price | Green |
| Good Deal | 86-95% of avg price | Light Green |
| Fair Price | 96-110% of avg price | Gray |
| Above Average | 111-130% of avg price | Yellow |
| Premium Price | >130% of avg price | Red |

### MSRP Comparison

- Compare paid price against manufacturer's suggested retail
- Calculate secondary market premium/discount
- Track MSRP vs street price trends

---

## Database Schema

### Core Tables

```sql
-- bottles table includes MSRP
CREATE TABLE bottles (
    id uuid PRIMARY KEY,
    name text NOT NULL,
    msrp numeric,  -- Manufacturer's suggested retail price
    ...
);

-- inventory tracks actual purchase prices
CREATE TABLE inventory (
    id uuid PRIMARY KEY,
    bottle_id uuid REFERENCES bottles(id),
    price_paid numeric,
    purchase_date date,
    purchase_location_id uuid,
    ...
);

-- purchase_locations for regional analysis
CREATE TABLE purchase_locations (
    id uuid PRIMARY KEY,
    name text NOT NULL,
    city text,
    state text,
    country text DEFAULT 'USA',
    type text,  -- 'store', 'online', 'bar', 'auction', etc.
    ...
);
```

### Aggregation Views (Phase 2)

```sql
-- Materialized view for bottle pricing stats
CREATE MATERIALIZED VIEW bottle_pricing_stats AS
SELECT 
    bottle_id,
    COUNT(*) as sample_count,
    AVG(price_paid) as avg_price,
    MIN(price_paid) as min_price,
    MAX(price_paid) as max_price,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price_paid) as median_price
FROM inventory
WHERE price_paid IS NOT NULL
GROUP BY bottle_id;

-- Regional pricing breakdown
CREATE MATERIALIZED VIEW bottle_regional_pricing AS
SELECT 
    i.bottle_id,
    pl.state,
    COUNT(*) as sample_count,
    AVG(i.price_paid) as avg_price
FROM inventory i
JOIN purchase_locations pl ON i.purchase_location_id = pl.id
WHERE i.price_paid IS NOT NULL
GROUP BY i.bottle_id, pl.state;
```

---

## API Endpoints

### Get Bottle Pricing Data

```
GET /api/v1/bottles/:id/pricing
```

**Response:**
```json
{
  "pricing": {
    "msrp": 34.99,
    "communityAvg": 42.50,
    "communityMin": 29.99,
    "communityMax": 89.99,
    "sampleCount": 247,
    "medianPrice": 39.99,
    "lastUpdated": "2024-01-15T10:30:00Z"
  },
  "regionalData": [
    { "state": "KY", "avgPrice": 34.99, "count": 45 },
    { "state": "CA", "avgPrice": 49.99, "count": 32 },
    { "state": "TX", "avgPrice": 38.99, "count": 28 }
  ]
}
```

### Analyze Deal Quality

```
GET /api/v1/bottles/:id/analyze-deal?price=45.99
```

**Response:**
```json
{
  "pricePaid": 45.99,
  "communityAvg": 42.50,
  "percentOfAvg": 108.2,
  "dealRating": "fair",
  "msrpComparison": {
    "msrp": 34.99,
    "premium": 31.4,
    "premiumLabel": "31% over MSRP"
  }
}
```

---

## Frontend Components

### BottlePricingCard

**Location:** `src/components/BottlePricingCard.jsx`

Displays community pricing intelligence on bottle detail pages:

```jsx
<BottlePricingCard
  msrp={bottle.msrp}
  communityPricing={pricingData}
  userPricePaid={inventoryItem?.price_paid}
/>
```

**Features:**
- MSRP display with source indicator
- Community average with sample count
- Price range (min-max)
- User's price vs community comparison
- Deal quality badge

**Visual Layout:**
```
┌─────────────────────────────────────────┐
│ Community Pricing                    ℹ️ │
├─────────────────────────────────────────┤
│ MSRP              $34.99                │
│ Community Avg     $42.50 (247 reports)  │
│ Price Range       $29.99 - $89.99       │
├─────────────────────────────────────────┤
│ Your Price        $39.99                │
│                   [Good Deal ✓]         │
└─────────────────────────────────────────┘
```

### DealBadge

**Location:** `src/components/DealBadge.jsx`

Inline badge showing deal quality:

```jsx
<DealBadge 
  pricePaid={39.99} 
  communityAvg={42.50} 
/>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| pricePaid | number | User's purchase price |
| communityAvg | number | Community average price |
| showPercentage | boolean | Show % difference |
| size | string | 'sm', 'md', 'lg' |

### PurchaseInfoSection

**Location:** `src/components/PurchaseInfoSection.jsx`

Form section for logging purchases with real-time deal analysis:

```jsx
<PurchaseInfoSection
  bottleId={selectedBottle.id}
  pricePaid={formData.price_paid}
  onPriceChange={(price) => setFormData({...formData, price_paid: price})}
  purchaseLocationId={formData.purchase_location_id}
  onLocationChange={(id) => setFormData({...formData, purchase_location_id: id})}
/>
```

**Features:**
- Price input with instant deal analysis
- Purchase location selector (with inline creation)
- Purchase date picker
- Real-time feedback as user types price

---

## Implementation Patterns

### Fetching Pricing Data

```javascript
// In BottleDetailPage
const [pricingData, setPricingData] = useState(null);

useEffect(() => {
  const fetchPricing = async () => {
    try {
      const response = await api.get(`/bottles/${id}/pricing`);
      setPricingData(response.data.pricing);
    } catch (error) {
      // Pricing data is supplementary - don't block page
      console.warn('Could not load pricing data');
    }
  };
  
  if (id) fetchPricing();
}, [id]);
```

### Real-Time Deal Analysis

```javascript
// In PurchaseInfoSection
const [dealAnalysis, setDealAnalysis] = useState(null);

useEffect(() => {
  const analyzeDeal = async () => {
    if (!bottleId || !pricePaid) {
      setDealAnalysis(null);
      return;
    }
    
    try {
      const response = await api.get(
        `/bottles/${bottleId}/analyze-deal`,
        { params: { price: pricePaid } }
      );
      setDealAnalysis(response.data);
    } catch (error) {
      setDealAnalysis(null);
    }
  };
  
  // Debounce to avoid excessive API calls
  const timer = setTimeout(analyzeDeal, 300);
  return () => clearTimeout(timer);
}, [bottleId, pricePaid]);
```

### Deal Rating Calculation (Backend)

```javascript
// services/pricingService.js
function calculateDealRating(pricePaid, communityAvg) {
  if (!communityAvg || communityAvg === 0) return null;
  
  const percentOfAvg = (pricePaid / communityAvg) * 100;
  
  if (percentOfAvg <= 85) return { rating: 'great', label: 'Great Deal' };
  if (percentOfAvg <= 95) return { rating: 'good', label: 'Good Deal' };
  if (percentOfAvg <= 110) return { rating: 'fair', label: 'Fair Price' };
  if (percentOfAvg <= 130) return { rating: 'above', label: 'Above Average' };
  return { rating: 'premium', label: 'Premium Price' };
}
```

---

## Styling

### Deal Badge Colors

```scss
// src/styles/_variables.scss
$deal-great: #22c55e;      // Green
$deal-good: #84cc16;       // Light green  
$deal-fair: #6b7280;       // Gray
$deal-above: #eab308;      // Yellow
$deal-premium: #ef4444;    // Red
```

### Badge Component Styles

```scss
// src/components/DealBadge.module.scss
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  
  &.great {
    background: rgba($deal-great, 0.15);
    color: $deal-great;
  }
  
  &.good {
    background: rgba($deal-good, 0.15);
    color: $deal-good;
  }
  
  &.fair {
    background: rgba($deal-fair, 0.15);
    color: $deal-fair;
  }
  
  &.above {
    background: rgba($deal-above, 0.15);
    color: $deal-above;
  }
  
  &.premium {
    background: rgba($deal-premium, 0.15);
    color: $deal-premium;
  }
}
```

---

## Privacy Considerations

### Data Anonymization

- Individual purchase prices are never exposed
- Only aggregated statistics are shown
- Minimum sample count (5) required before showing data
- No user attribution in pricing data

### User Control

- Users can opt-out of contributing to pricing data
- Price data can be marked as private per-item
- Regional data only shown with sufficient samples

---

## Phase 2 Enhancements

### Price Trends

- Historical price charts
- 30/60/90 day moving averages
- Seasonal pricing patterns

### Enhanced Regional Data

- City-level pricing
- Store-specific pricing reputation
- Online vs retail comparison

### Alerts

- Price drop notifications
- Wishlist price alerts
- Deal threshold notifications

---

## See Also

- [Components Reference](./COMPONENTS.md) - Component documentation
- [API Integration](./API_INTEGRATION.md) - API patterns
- [Barrel Tracking](./BARREL_TRACKING.md) - Related feature