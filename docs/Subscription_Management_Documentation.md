# Subscription Management System Documentation

## Overview

The Subscription Management system provides comprehensive functionality for SuperAdmins to manage user subscriptions, subscription plans, billing cycles, and automated payment processing. This system handles everything from subscription creation to renewal, cancellation, and analytics.

## Features Implemented

### 1. Subscription Dashboard & Analytics

- **Number of paid subscribers** - Total active and trial subscribers
- **Subscription revenue tracking** - Total revenue, monthly trends, growth rates
- **Subscription status distribution** - Active, trial, cancelled, expired, suspended counts
- **Plan performance metrics** - Subscription counts and revenue by plan type
- **Growth analytics** - Month-over-month subscription growth rates
- **Churn analysis** - Cancellation reasons and trends
- **Revenue trends** - Historical revenue data and projections

### 2. Subscription Plans Management

- **Plan creation and editing** - Create multiple subscription tiers
- **Pricing configuration** - Support for multiple billing cycles (monthly, quarterly, yearly, lifetime)
- **Feature management** - Define plan features and limits
- **Plan comparison** - Generate comparison data for frontend display
- **Plan activation/deactivation** - Control plan availability
- **Recommended plans** - Mark plans as recommended or popular
- **Custom features** - Add plan-specific custom features
- **Trial period configuration** - Set up trial periods for plans

### 3. Subscription Status Management

- **Active subscriptions** - Currently paying subscribers
- **Trial subscriptions** - Users in trial period
- **Inactive/Cancelled** - Cancelled or expired subscriptions
- **Suspended subscriptions** - Temporarily suspended accounts
- **Pending payment** - Subscriptions awaiting payment
- **Status transitions** - Manage subscription lifecycle
- **Admin actions tracking** - Audit trail of all status changes

### 4. Automated Subscription Renewal and Payment Processing

- **Auto-renewal settings** - Enable/disable automatic renewals
- **Billing cycle management** - Handle different billing frequencies
- **Payment due tracking** - Monitor upcoming payment dates
- **Expiration alerts** - Track subscriptions nearing expiration
- **Renewal processing** - Manual and automated renewal capabilities
- **Payment failure handling** - Manage failed payment scenarios
- **Grace periods** - Configure grace periods for expired subscriptions

### 5. Advanced Subscription Features

- **Usage tracking** - Monitor feature usage against plan limits
- **Plan upgrades/downgrades** - Change subscription plans
- **Billing history** - Track payment and billing events
- **Discount management** - Apply and track discount codes
- **Admin notes** - Add administrative notes to subscriptions
- **Multi-currency support** - Handle different currencies
- **Gateway integration ready** - Prepared for Stripe, PayPal, etc.

## Database Schema

### Subscription Model

```javascript
{
  // User Information
  userId: ObjectId (ref: User),
  userEmail: String,

  // Plan Details
  planId: ObjectId (ref: SubscriptionPlan),
  planName: String,
  planType: String (enum: basic/premium/professional/enterprise),

  // Status and Dates
  status: String (enum: trial/active/inactive/cancelled/expired/suspended/pending_payment/pending_cancellation),
  startDate: Date,
  endDate: Date,
  trialStartDate: Date,
  trialEndDate: Date,

  // Billing Information
  billingCycle: String (enum: monthly/quarterly/yearly/lifetime),
  amount: Number,
  currency: String,
  autoRenew: Boolean,
  nextBillingDate: Date,
  lastBillingDate: Date,

  // Payment Gateway
  paymentMethod: String,
  paymentGateway: String,
  gatewaySubscriptionId: String,
  gatewayCustomerId: String,

  // Usage Tracking
  features: {
    maxUsers: Number,
    maxProjects: Number,
    storageLimit: Number,
    apiCallsLimit: Number,
    supportLevel: String,
    customFeatures: Array
  },
  currentUsage: {
    users: Number,
    projects: Number,
    storageUsed: Number,
    apiCallsUsed: Number,
    lastUpdated: Date
  },

  // Admin and History
  adminNotes: Array,
  upgradeHistory: Array,
  cancellationReason: String,
  timestamps: true
}
```

### SubscriptionPlan Model

```javascript
{
  // Plan Information
  name: String,
  description: String,
  type: String (enum: basic/premium/professional/enterprise),

  // Pricing
  price: Number,
  currency: String,
  billingCycles: [{
    cycle: String,
    price: Number,
    discount: Number
  }],

  // Trial Configuration
  trialPeriod: {
    enabled: Boolean,
    duration: Number,
    features: String
  },

  // Features and Limits
  features: {
    maxUsers: Number,
    maxProjects: Number,
    storageLimit: Number,
    apiCallsLimit: Number,
    supportLevel: String,
    advancedAnalytics: Boolean,
    customBranding: Boolean,
    prioritySupport: Boolean,
    apiAccess: Boolean,
    customIntegrations: Boolean,
    multiUserCollaboration: Boolean,
    advancedSecurity: Boolean,
    customFeatures: Array
  },

  // Plan Management
  isActive: Boolean,
  isPublic: Boolean,
  isRecommended: Boolean,
  isPopular: Boolean,
  displayOrder: Number,

  // Promotional
  promotionalOffer: Object,
  restrictions: Object,
  comparisonHighlights: Array,

  // Statistics
  stats: {
    totalSubscribers: Number,
    activeSubscribers: Number,
    totalRevenue: Number,
    lastUpdated: Date
  },

  timestamps: true
}
```

## API Endpoints

### Subscription Dashboard & Analytics

```
GET /admin/subscriptions/dashboard?timeframe=30
- Get subscription overview and dashboard data
- Query params: timeframe (days or 'all')
- Returns: statistics, alerts, recent activities, trends

GET /admin/subscriptions/analytics?period=12
- Get detailed subscription analytics
- Query params: period (months)
- Returns: subscription trends, revenue trends, churn analysis, plan performance
```

### Subscription Management

```
GET /admin/subscriptions
- Get all subscriptions with filtering and pagination
- Query params: page, limit, sortBy, sortOrder, search, status, planType, billingCycle, dateFrom, dateTo, autoRenew
- Returns: paginated subscriptions with user and plan details

GET /admin/subscriptions/:subscriptionId
- Get single subscription details
- Returns: complete subscription information with usage stats

PUT /admin/subscriptions/:subscriptionId/activate
- Activate a subscription
- Returns: updated subscription

PUT /admin/subscriptions/:subscriptionId/cancel
- Cancel a subscription
- Body: { reason: string, feedback?: string, cancelledBy?: string }
- Returns: updated subscription

PUT /admin/subscriptions/:subscriptionId/suspend
- Suspend a subscription
- Body: { reason: string }
- Returns: updated subscription

PUT /admin/subscriptions/:subscriptionId/reactivate
- Reactivate a suspended subscription
- Returns: updated subscription
```

### Subscription Plan Management

```
PUT /admin/subscriptions/:subscriptionId/change-plan
- Change subscription plan
- Body: { newPlanId: string, reason?: string }
- Returns: updated subscription

PUT /admin/subscriptions/:subscriptionId/auto-renewal
- Update auto-renewal settings
- Body: { autoRenew: boolean, reason?: string }
- Returns: updated subscription

POST /admin/subscriptions/:subscriptionId/renew
- Manually renew a subscription
- Body: { billingCycle?: string }
- Returns: renewed subscription
```

### Subscription Notes and Usage

```
POST /admin/subscriptions/:subscriptionId/notes
- Add admin note to subscription
- Body: { note: string, type?: string }
- Returns: subscription with new note

PUT /admin/subscriptions/:subscriptionId/usage
- Update subscription usage data
- Body: { usageData: object }
- Returns: subscription with updated usage
```

### Subscription Alerts

```
GET /admin/subscriptions/expiring?days=7
- Get subscriptions expiring within specified days
- Query params: days (default: 7)
- Returns: list of expiring subscriptions

GET /admin/subscriptions/due-renewal
- Get subscriptions due for renewal
- Returns: list of subscriptions due for renewal
```

### Plan Management

```
GET /admin/plans
- Get all subscription plans with filtering
- Query params: page, limit, sortBy, sortOrder, search, type, isActive, isPublic
- Returns: paginated plans

GET /admin/plans/active?includePrivate=false
- Get active plans for public use
- Query params: includePrivate
- Returns: active plans

GET /admin/plans/comparison
- Get plan comparison data
- Returns: plans formatted for comparison display

POST /admin/plans
- Create new subscription plan
- Body: complete plan object
- Returns: created plan

PUT /admin/plans/:planId
- Update subscription plan
- Body: plan update data
- Returns: updated plan

PUT /admin/plans/:planId/status
- Activate or deactivate a plan
- Body: { isActive: boolean }
- Returns: updated plan

PUT /admin/plans/:planId/recommended
- Set plan as recommended
- Returns: updated plan

PUT /admin/plans/:planId/pricing
- Update plan pricing
- Body: { price?: number, billingCycles?: array }
- Returns: updated plan

POST /admin/plans/:planId/features
- Add custom feature to plan
- Body: { name: string, description?: string, enabled?: boolean, limit?: number }
- Returns: updated plan

DELETE /admin/plans/:planId/features/:featureName
- Remove custom feature from plan
- Returns: updated plan

DELETE /admin/plans/:planId
- Delete subscription plan (SuperAdmin only)
- Body: { confirmDelete: true }
- Returns: deleted plan data
```

### Data Export

```
GET /admin/subscriptions/export
- Export subscription data
- Query params: format (csv/json), status, planType, dateFrom, dateTo, includeUsage
- Returns: CSV file download or JSON data
```

## Security & Validation

### Access Control

- **Admin Role Required** - All endpoints require admin authentication
- **SuperAdmin Only** - Plan deletion restricted to SuperAdmins
- **Rate Limiting** - Bulk operations protected against abuse

### Input Validation

- **Subscription Data** - Status validation, date ranges, amount validation
- **Plan Data** - Name uniqueness, feature validation, pricing validation
- **Billing Cycles** - Valid cycle types, pricing constraints
- **Usage Data** - Non-negative integers, valid field names
- **Filter Parameters** - Enum validation, date format validation

### Data Protection

- **Sensitive Data Filtering** - Payment gateway IDs protected in responses
- **Audit Trail** - All admin actions tracked with timestamps
- **Validation Rules** - Comprehensive validation for all operations

## Usage Examples

### Getting Subscription Dashboard

```javascript
// Get last 30 days subscription statistics
GET /admin/subscriptions/dashboard?timeframe=30

Response:
{
  "success": true,
  "data": {
    "overview": {
      "totalSubscriptions": 2500,
      "paidSubscribers": 2100,
      "averageAmount": 29.99,
      "totalRevenue": 62979,
      "subscriptionGrowthRate": 15.5
    },
    "planStatistics": {
      "overview": { "totalPlans": 4, "activePlans": 4 },
      "planPerformance": [...]
    },
    "alerts": {
      "expiringSubscriptions": 45,
      "dueForRenewal": 123
    },
    "trends": { ... }
  }
}
```

### Searching Subscriptions

```javascript
// Search for active premium subscriptions
GET /admin/subscriptions?status=active&planType=premium&page=1&limit=20

Response:
{
  "success": true,
  "data": {
    "subscriptions": [...],
    "pagination": {
      "current": 1,
      "pages": 15,
      "total": 285,
      "limit": 20
    }
  }
}
```

### Creating Subscription Plan

```javascript
// Create new premium plan
POST /admin/plans
{
  "name": "Premium Plan",
  "description": "Advanced features for growing businesses",
  "type": "premium",
  "price": 49.99,
  "billingCycles": [
    { "cycle": "monthly", "price": 49.99, "discount": 0 },
    { "cycle": "yearly", "price": 499.99, "discount": 16 }
  ],
  "features": {
    "maxUsers": 10,
    "maxProjects": 50,
    "storageLimit": 100,
    "apiCallsLimit": 50000,
    "supportLevel": "premium",
    "advancedAnalytics": true,
    "prioritySupport": true
  },
  "trialPeriod": {
    "enabled": true,
    "duration": 14,
    "features": "full"
  }
}

Response:
{
  "success": true,
  "message": "Subscription plan created successfully",
  "data": {
    "plan": { ... }
  }
}
```

### Cancelling Subscription

```javascript
// Cancel subscription with reason
PUT /admin/subscriptions/60f7b1c4e1234567890abcde/cancel
{
  "reason": "Customer requested cancellation due to budget constraints",
  "feedback": "Great service, but need to reduce costs",
  "cancelledBy": "admin"
}

Response:
{
  "success": true,
  "message": "Subscription cancelled successfully",
  "data": {
    "subscription": { ... }
  }
}
```

### Getting Subscription Analytics

```javascript
// Get 12-month analytics
GET /admin/subscriptions/analytics?period=12

Response:
{
  "success": true,
  "data": {
    "subscriptionTrends": [...],
    "revenueTrends": [...],
    "churnAnalysis": [...],
    "planPerformance": [...],
    "period": "12 months"
  }
}
```

## Integration Notes

### With User Management System

- Subscriptions linked to User model via `userId`
- User status affects subscription visibility
- Admin actions tracked in both systems

### With Payment Gateways

- Gateway-agnostic design supports multiple providers
- Webhook endpoints ready for payment notifications
- Subscription IDs mapped to gateway subscription IDs

### Database Optimization

- Comprehensive indexing for performance
- Compound indexes for common query patterns
- Statistics caching for dashboard performance

## Automated Processes

### Subscription Renewal

1. **Daily Check** - System checks for subscriptions due for renewal
2. **Auto-Renewal Processing** - Process renewals for auto-renew enabled subscriptions
3. **Payment Processing** - Integrate with payment gateway for charges
4. **Status Updates** - Update subscription status based on payment results
5. **Notifications** - Send renewal confirmations or failure notices

### Expiration Management

1. **Expiration Monitoring** - Daily check for expiring subscriptions
2. **Grace Period** - Allow continued access during grace period
3. **Status Updates** - Mark subscriptions as expired after grace period
4. **Feature Limitation** - Restrict features for expired subscriptions

### Usage Tracking

1. **Real-time Updates** - Track feature usage as it occurs
2. **Limit Enforcement** - Prevent usage beyond plan limits
3. **Usage Alerts** - Notify users approaching limits
4. **Upgrade Suggestions** - Suggest plan upgrades based on usage

## Future Enhancements

### Possible Extensions

1. **Advanced Analytics** - Cohort analysis, LTV calculations
2. **A/B Testing** - Test different pricing strategies
3. **Usage-Based Billing** - Implement metered billing
4. **Multi-Currency** - Advanced currency conversion
5. **Dunning Management** - Automated failed payment handling
6. **Subscription Pausing** - Allow temporary subscription pauses
7. **Enterprise Features** - Custom contracts, invoicing

### Performance Improvements

1. **Caching Layer** - Redis caching for frequent queries
2. **Background Jobs** - Queue-based subscription processing
3. **Event Sourcing** - Track all subscription events
4. **Data Archiving** - Archive old subscription data

This comprehensive Subscription Management system provides SuperAdmins with complete control over subscription lifecycle, billing, analytics, and customer management while supporting automated renewal and payment processing.
