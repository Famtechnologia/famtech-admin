# Analytics and Insights System Documentation

## Overview

The Analytics and Insights system provides comprehensive analytics capabilities for SuperAdmins to track user engagement, platform usage, revenue performance, and customer demographics. This system enables data-driven decision making through detailed metrics, segmentation analysis, and customizable reporting.

## Features Implemented

### 1. User Engagement Metrics

- **Login frequency tracking** - Total logins, session duration, login streaks
- **Time spent on platform** - Daily, weekly, monthly usage patterns
- **Activity status monitoring** - Very active, active, moderately active, low activity, inactive
- **Engagement scoring** - Activity, interaction, and retention scores (0-100 scale)
- **Session analytics** - Average session duration, longest sessions
- **User retention analysis** - Login streaks, consistency metrics

### 2. Usage Statistics and Feature Adoption

- **Core feature usage** - Profile views, search queries, reviews, messaging
- **Communication features** - Consultation requests, messages sent/received
- **Platform features** - Document uploads/downloads, forum participation, help center visits
- **Advanced features** - Analytics views, API calls, custom reports, integrations
- **Feature adoption rates** - Percentage of users adopting each feature
- **Search behavior analysis** - Search terms, success rates, query patterns
- **Usage trends** - Feature usage over time, adoption patterns

### 3. Revenue and Sales Data

- **Subscription revenue tracking** - Total revenue, MRR, revenue by plan type
- **Financial KPIs** - ARPU, customer lifetime value, churn rate, conversion rate
- **Revenue trends** - Historical revenue data, growth patterns
- **Subscription metrics** - New subscriptions, renewals, cancellations, upgrades
- **Plan performance** - Revenue and subscriber count by plan
- **Billing cycle analysis** - Revenue distribution by billing frequency
- **Customer value segmentation** - High, medium, low value customers

### 4. Customer Demographics and Segmentation

- **Role-based analytics** - Farmers, advisors, viewers usage patterns
- **Geographic distribution** - Country, region-based user analytics
- **Device and technology usage** - Desktop, mobile, tablet usage patterns
- **Engagement-based segmentation** - Champions, loyalists, at-risk users
- **Subscription-based segmentation** - Plan type usage and behavior
- **User growth stages** - Skill levels, onboarding progress, achievements
- **Age and experience distribution** - User maturity and experience levels

## Database Models

### UserAnalytics Model

```javascript
{
  // User Information
  userId: ObjectId (ref: User),
  userEmail: String,
  userRole: String (enum: farmer/advisor/viewer),

  // Engagement Metrics
  loginFrequency: {
    totalLogins: Number,
    lastLogin: Date,
    firstLogin: Date,
    averageSessionDuration: Number, // in minutes
    longestSession: Number,
    loginStreak: {
      current: Number,
      longest: Number,
      lastLoginDate: Date
    }
  },

  // Time Metrics
  timeMetrics: {
    totalTimeSpent: Number, // in minutes
    averageTimePerSession: Number,
    timeSpentToday: Number,
    timeSpentThisWeek: Number,
    timeSpentThisMonth: Number,
    lastActivityDate: Date
  },

  // Feature Usage
  featureUsage: {
    profileViews: Number,
    reviewsSubmitted: Number,
    searchQueries: Number,
    messagesent: Number,
    consultationRequests: Number,
    documentsUploaded: Number,
    forumsParticipation: Number,
    advancedAnalyticsViews: Number,
    // ... more features
  },

  // Search Behavior
  searchBehavior: {
    totalSearches: Number,
    uniqueSearchTerms: Number,
    topSearchTerms: [{
      term: String,
      count: Number,
      lastSearched: Date
    }],
    searchSuccessRate: Number, // percentage
    averageResultsClicked: Number
  },

  // Device Information
  deviceInfo: {
    primaryDevice: String (enum: desktop/mobile/tablet),
    operatingSystem: String,
    browser: String,
    location: {
      country: String,
      region: String,
      city: String,
      timezone: String
    },
    accessFrequency: {
      desktop: Number,
      mobile: Number,
      tablet: Number
    }
  },

  // Engagement Scores
  engagementScores: {
    overall: Number, // 0-100 scale
    activityScore: Number,
    interactionScore: Number,
    retentionScore: Number,
    lastCalculated: Date
  },

  // User Growth
  userGrowth: {
    accountAge: Number, // in days
    skillLevel: String (enum: beginner/intermediate/advanced/expert),
    completedOnboarding: Boolean,
    onboardingProgress: Number, // percentage
    goalsAchieved: Number,
    badgesEarned: Number
  },

  // Subscription Analytics
  subscriptionAnalytics: {
    subscriptionId: ObjectId (ref: Subscription),
    planType: String,
    subscriptionValue: Number,
    lifetimeValue: Number,
    upgradePotential: Number, // 0-100 scale
    churnRisk: Number // 0-100 scale
  },

  // Historical Data
  monthlyStats: [{
    month: Number,
    year: Number,
    logins: Number,
    timeSpent: Number,
    featuresUsed: Number,
    searchQueries: Number,
    engagementScore: Number,
    createdAt: Date
  }],

  timestamps: true
}
```

### SystemAnalytics Model

```javascript
{
  // Date Tracking
  date: Date,
  dateString: String, // YYYY-MM-DD format

  // Platform Metrics
  platformMetrics: {
    totalUsers: Number,
    newUsersToday: Number,
    activeUsers: {
      daily: Number,
      weekly: Number,
      monthly: Number
    },
    returningUsers: Number,
    userGrowthRate: Number, // percentage
    usersByRole: {
      farmers: Number,
      advisors: Number,
      viewers: Number
    },
    usersByStatus: {
      active: Number,
      inactive: Number,
      pending: Number,
      suspended: Number
    }
  },

  // Engagement Metrics
  engagementMetrics: {
    totalLogins: Number,
    uniqueLogins: Number,
    averageSessionDuration: Number, // in minutes
    totalTimeSpent: Number,
    bounceRate: Number, // percentage
    userRetentionRate: {
      daily: Number,
      weekly: Number,
      monthly: Number
    },
    engagementScoreDistribution: {
      high: Number, // 70-100
      medium: Number, // 40-69
      low: Number // 0-39
    }
  },

  // Feature Adoption
  featureAdoption: {
    // Core Features
    profileViews: Number,
    searchQueries: Number,
    reviewsSubmitted: Number,
    messagesent: Number,

    // Advanced Features
    documentsUploaded: Number,
    forumsParticipation: Number,
    consultationRequests: Number,
    helpCenterVisits: Number,
    advancedAnalyticsViews: Number,
    apiCallsUsed: Number,
    customReportsGenerated: Number,
    integrationUsage: Number,

    // Feature Adoption Rates
    featureAdoptionRates: {
      profileCompletion: Number, // percentage
      searchUsage: Number,
      reviewParticipation: Number,
      messagingUsage: Number,
      documentSharing: Number,
      forumParticipation: Number
    }
  },

  // Search Analytics
  searchAnalytics: {
    totalSearches: Number,
    uniqueSearchTerms: Number,
    searchSuccessRate: Number, // percentage
    topSearchTerms: [{
      term: String,
      count: Number,
      successRate: Number
    }],
    searchesByCategory: {
      agricultural: Number,
      weather: Number,
      crops: Number,
      livestock: Number,
      equipment: Number,
      market: Number,
      other: Number
    }
  },

  // Revenue Metrics
  revenueMetrics: {
    // Subscription Revenue
    totalRevenue: Number,
    revenueByPlan: {
      basic: Number,
      premium: Number,
      professional: Number,
      enterprise: Number
    },
    newSubscriptionRevenue: Number,
    renewalRevenue: Number,
    upgradeRevenue: Number,

    // Subscription Metrics
    totalSubscriptions: Number,
    newSubscriptions: Number,
    cancelledSubscriptions: Number,
    renewedSubscriptions: Number,
    upgradedSubscriptions: Number,
    downgradedSubscriptions: Number,

    // Financial KPIs
    averageRevenuePerUser: Number,
    monthlyRecurringRevenue: Number,
    customerLifetimeValue: Number,
    churnRate: Number, // percentage
    conversionRate: Number // percentage
  },

  // Customer Demographics
  customerDemographics: {
    // Geographic Distribution
    geography: {
      countries: [{
        name: String,
        userCount: Number,
        revenue: Number
      }],
      regions: [{
        name: String,
        userCount: Number,
        revenue: Number
      }],
      topCountries: [{
        country: String,
        count: Number,
        percentage: Number
      }]
    },

    // Age Distribution
    ageGroups: {
      under25: Number,
      age25to34: Number,
      age35to44: Number,
      age45to54: Number,
      age55to64: Number,
      over65: Number
    },

    // User Type Distribution
    userTypes: {
      smallFarmers: Number,
      largeFarmers: Number,
      agriculturalAdvisors: Number,
      researchers: Number,
      students: Number,
      other: Number
    },

    // Experience Level
    experienceLevels: {
      beginner: Number,
      intermediate: Number,
      advanced: Number,
      expert: Number
    }
  },

  // Customer Segmentation
  customerSegmentation: {
    // Value-based Segmentation
    highValue: {
      count: Number,
      revenue: Number,
      criteria: String
    },
    mediumValue: {
      count: Number,
      revenue: Number,
      criteria: String
    },
    lowValue: {
      count: Number,
      revenue: Number,
      criteria: String
    },

    // Engagement-based Segmentation
    champions: { count: Number, description: String },
    loyalists: { count: Number, description: String },
    potentialLoyalists: { count: Number, description: String },
    newCustomers: { count: Number, description: String },
    atRisk: { count: Number, description: String },
    cannotLoseThem: { count: Number, description: String },
    hibernating: { count: Number, description: String }
  },

  // Technology Metrics
  technologyMetrics: {
    deviceUsage: {
      desktop: Number,
      mobile: Number,
      tablet: Number
    },
    operatingSystems: {
      windows: Number,
      macos: Number,
      linux: Number,
      android: Number,
      ios: Number,
      other: Number
    },
    browsers: {
      chrome: Number,
      firefox: Number,
      safari: Number,
      edge: Number,
      other: Number
    },
    mobileAppUsage: {
      totalSessions: Number,
      averageSessionLength: Number,
      crashRate: Number
    }
  },

  // Performance Metrics
  performanceMetrics: {
    averageResponseTime: Number, // in milliseconds
    uptime: Number, // percentage
    errorRate: Number, // percentage
    pageLoadTimes: {
      homepage: Number,
      dashboard: Number,
      search: Number,
      profile: Number
    },
    userSatisfactionScore: Number // 1-10 scale
  },

  // Marketing Metrics
  marketingMetrics: {
    trafficSources: {
      organic: Number,
      direct: Number,
      referral: Number,
      social: Number,
      email: Number,
      paid: Number
    },
    conversionFunnel: {
      visitors: Number,
      signups: Number,
      activations: Number,
      subscriptions: Number,
      renewals: Number
    },
    campaignMetrics: [{
      campaignName: String,
      impressions: Number,
      clicks: Number,
      conversions: Number,
      cost: Number,
      revenue: Number,
      roi: Number
    }]
  },

  // Support Metrics
  supportMetrics: {
    helpCenterViews: Number,
    supportTickets: {
      total: Number,
      resolved: Number,
      pending: Number,
      averageResolutionTime: Number // in hours
    },
    userFeedback: {
      totalFeedback: Number,
      positivePercentage: Number,
      averageRating: Number
    },
    npsScore: Number // Net Promoter Score
  },

  timestamps: true
}
```

## API Endpoints

### Analytics Dashboard

```
GET /admin/analytics/dashboard?timeframe=30
- Get main analytics dashboard with KPIs and trends
- Query params: timeframe (days or 'all')
- Returns: overview metrics, trends, alerts, last updated timestamp

Response:
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 2500,
      "activeUsers": 1850,
      "totalRevenue": 125000,
      "averageEngagement": 68.5,
      "userGrowthRate": 15.2,
      "churnRate": 3.8,
      "conversionRate": 12.5,
      "customerLifetimeValue": 485
    },
    "trends": {
      "users": [...],
      "revenue": [...],
      "engagement": [...]
    },
    "alerts": {
      "lowEngagementUsers": 125,
      "inactiveUsers": 320,
      "highChurnRisk": 45
    },
    "timeframe": "30 days",
    "lastUpdated": "2025-09-23T10:30:00Z"
  }
}
```

### User Engagement Metrics

```
GET /admin/analytics/engagement?timeframe=30&userRole=farmer&engagementLevel=high&page=1&limit=20&sortBy=engagementScores.overall&sortOrder=desc
- Get user engagement metrics and analytics
- Query params: timeframe, userRole, engagementLevel, pagination, sorting
- Returns: user engagement data with statistics and distributions

Response:
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "current": 1,
      "pages": 25,
      "total": 485,
      "limit": 20
    },
    "statistics": {
      "overall": {
        "totalUsers": 485,
        "activeUsers": 420,
        "averageEngagement": 72.3,
        "averageLoginFrequency": 24.5,
        "averageTimeSpent": 145
      },
      "distribution": [...],
      "retention": [...]
    },
    "filters": {
      "timeframe": "30",
      "userRole": "farmer",
      "engagementLevel": "high"
    }
  }
}
```

### Usage Statistics

```
GET /admin/analytics/usage?timeframe=30&featureCategory=core
- Get platform usage statistics and feature adoption rates
- Query params: timeframe, featureCategory
- Returns: feature usage data, adoption rates, search analytics

Response:
{
  "success": true,
  "data": {
    "overview": {
      "totalActiveUsers": 1850,
      "averageTimeSpent": 145,
      "totalFeatureUsage": 125430
    },
    "featureUsage": {
      "coreFeatures": {
        "profileViews": 45230,
        "searchQueries": 38940,
        "reviewsSubmitted": 12580,
        "messagesSent": 28620
      },
      "communicationFeatures": {
        "consultationRequests": 8940,
        "consultationProvided": 6720
      },
      "platformFeatures": {
        "documentsUploaded": 15680,
        "documentsDownloaded": 23450,
        "forumsParticipation": 9830,
        "helpCenterVisits": 18790
      },
      "advancedFeatures": {
        "advancedAnalyticsViews": 3450,
        "apiCallsUsed": 89430,
        "customReportsGenerated": 1250,
        "integrationUsage": 2340
      }
    },
    "adoptionRates": {
      "profileViews": 95.8,
      "searchQueries": 87.3,
      "reviewsSubmitted": 45.2,
      "messaging": 68.9,
      "consultations": 32.1,
      "documentSharing": 58.4,
      "forumParticipation": 28.7,
      "advancedFeatures": 15.3
    },
    "adoptionByRole": [...],
    "searchAnalytics": {
      "overview": {
        "totalSearches": 38940,
        "avgSearchSuccessRate": 84.2,
        "totalUniqueTerms": 8450,
        "usersSearching": 1620
      },
      "topSearchTerms": [...]
    },
    "timeframe": "30 days"
  }
}
```

### Revenue Analytics

```
GET /admin/analytics/revenue?timeframe=30&planType=premium&currency=USD&period=daily
- Get revenue analytics, subscription metrics, and financial KPIs
- Query params: timeframe, planType, currency, period
- Returns: revenue data, trends, breakdowns, customer metrics

Response:
{
  "success": true,
  "data": {
    "overview": {
      "totalRevenue": 125000,
      "monthlyRecurringRevenue": 45000,
      "averageRevenuePerUser": 67.50,
      "totalSubscriptions": 1850,
      "churnRate": 3.8,
      "newSubscriptions": 125,
      "renewedSubscriptions": 340
    },
    "trends": [...],
    "breakdown": {
      "byPlan": [...],
      "byBillingCycle": [...],
      "topPerformingPlans": [...]
    },
    "customerMetrics": {
      "lifetimeValue": [...],
      "churnAnalysis": [...]
    },
    "timeframe": "30 days",
    "currency": "USD"
  }
}
```

### Customer Demographics

```
GET /admin/analytics/demographics?segmentBy=role&includeInactive=false
- Get customer demographics and segmentation analysis
- Query params: segmentBy, includeInactive
- Returns: demographic data, segmentation, geographic distribution

Response:
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 2500,
      "segmentBy": "role",
      "includeInactive": false
    },
    "demographics": {
      "byRole": [...],
      "geographic": [...],
      "device": [...]
    },
    "segmentation": {
      "byEngagement": [...],
      "bySubscription": [...],
      "byGrowthStage": [...]
    },
    "insights": {
      "topUserRole": "farmer",
      "topCountry": "United States",
      "primaryDevice": "mobile",
      "averageEngagementScore": 68.5
    }
  }
}
```

### Analytics Export

```
GET /admin/analytics/export?type=engagement&format=csv&timeframe=30&includeDetails=true
- Export analytics data in JSON or CSV format
- Query params: type, format, timeframe, includeDetails
- Returns: Downloadable file or JSON data

Response (CSV):
Content-Type: text/csv
Content-Disposition: attachment; filename="engagement_analytics_2025-09-23.csv"
[CSV data]

Response (JSON):
{
  "success": true,
  "data": [...],
  "metadata": {
    "type": "engagement",
    "timeframe": "30 days",
    "recordCount": 1850,
    "exportedAt": "2025-09-23T10:30:00Z",
    "includeDetails": true
  }
}
```

### User Analytics Update

```
POST /admin/analytics/users/:userId/update
Body: {
  "action": "login",
  "data": {
    "sessionDuration": 45
  }
}
- Update user analytics data (login, feature usage, etc.)
- Actions: login, timeSpent, featureUsage, search, calculateScores
- Returns: Updated analytics summary

Response:
{
  "success": true,
  "message": "User analytics updated successfully",
  "data": {
    "userId": "60f7b1c4e1234567890abcde",
    "action": "login",
    "engagementScore": 72,
    "activityStatus": "very_active"
  }
}
```

## Analytics Methods and Calculations

### Engagement Score Calculation

```javascript
// Activity Score (40% weight)
const loginFrequencyScore = Math.min(
  (totalLogins / daysSinceJoining) * 100,
  100
);
const recencyScore = Math.max(100 - daysSinceLastLogin * 5, 0);
activityScore = (loginFrequencyScore + recencyScore) / 2;

// Interaction Score (30% weight)
const totalFeatureUsage = sum(allFeatureUsageCounts);
interactionScore = Math.min((totalFeatureUsage / daysSinceJoining) * 10, 100);

// Retention Score (30% weight)
const streakScore = Math.min(longestLoginStreak * 5, 50);
const consistencyScore = Math.min((totalLogins / daysSinceJoining) * 50, 50);
retentionScore = streakScore + consistencyScore;

// Overall Score
overallScore =
  activityScore * 0.4 + interactionScore * 0.3 + retentionScore * 0.3;
```

### User Activity Status

```javascript
const daysSinceLastLogin = Math.floor(
  (Date.now() - lastLogin) / (1000 * 60 * 60 * 24)
);

if (daysSinceLastLogin <= 1) return "very_active";
if (daysSinceLastLogin <= 7) return "active";
if (daysSinceLastLogin <= 30) return "moderately_active";
if (daysSinceLastLogin <= 90) return "low_activity";
return "inactive";
```

### Customer Segmentation

```javascript
// Engagement-based segmentation
const engagementSegments = {
  champions: { score: ">80", frequency: "daily", value: "high" },
  loyalists: { score: "60-80", frequency: "weekly", value: "medium-high" },
  potentialLoyalists: { score: "40-60", frequency: "weekly", value: "medium" },
  newCustomers: { accountAge: "<30 days", score: ">40" },
  atRisk: { score: "20-40", frequency: "monthly", trend: "declining" },
  cannotLoseThem: { score: "<40", value: "high", frequency: "rare" },
  hibernating: { score: "<20", frequency: "none", lastLogin: ">90 days" },
};

// Value-based segmentation
const valueSegments = {
  highValue: {
    lifetimeValue: ">$500",
    planType: ["professional", "enterprise"],
  },
  mediumValue: { lifetimeValue: "$100-500", planType: ["premium"] },
  lowValue: { lifetimeValue: "<$100", planType: ["basic", "trial"] },
};
```

## Security and Privacy

### Data Protection

- **Sensitive Data Filtering** - Personal information excluded from bulk exports
- **Access Control** - Admin role required for all analytics endpoints
- **Data Anonymization** - User identifiable information protected in aggregations
- **Audit Trail** - All analytics access and exports logged

### Performance Optimization

- **Database Indexing** - Comprehensive indexes for query performance
- **Aggregation Pipelines** - Efficient MongoDB aggregations for large datasets
- **Caching Strategy** - Frequently accessed analytics cached for performance
- **Data Archiving** - Historical data archived to maintain performance

## Real-time Analytics Updates

### Automatic Tracking

```javascript
// Login tracking
userAnalytics.updateLoginFrequency(sessionDuration);

// Time tracking
userAnalytics.updateTimeSpent(minutes);

// Feature usage tracking
userAnalytics.updateFeatureUsage("searchQueries", 1);

// Search tracking
userAnalytics.addSearchQuery(searchTerm, foundResults);

// Engagement score calculation
userAnalytics.calculateEngagementScores();
```

### Batch Processing

- **Daily Aggregation** - System analytics calculated daily
- **Monthly Archiving** - User stats archived monthly
- **Score Recalculation** - Engagement scores updated regularly
- **Trend Analysis** - Historical trend data processed

## Usage Examples

### Getting Analytics Dashboard

```javascript
// Get 30-day dashboard overview
GET /admin/analytics/dashboard?timeframe=30

// Get all-time analytics
GET /admin/analytics/dashboard?timeframe=all
```

### Filtering User Engagement

```javascript
// Get high-engagement farmers
GET /admin/analytics/engagement?userRole=farmer&engagementLevel=high&timeframe=30

// Get users sorted by activity score
GET /admin/analytics/engagement?sortBy=engagementScores.activityScore&sortOrder=desc
```

### Analyzing Feature Adoption

```javascript
// Get core feature usage
GET /admin/analytics/usage?featureCategory=core&timeframe=30

// Get all feature usage statistics
GET /admin/analytics/usage?timeframe=90
```

### Revenue Analysis

```javascript
// Get premium plan revenue
GET /admin/analytics/revenue?planType=premium&timeframe=30

// Get quarterly revenue trends
GET /admin/analytics/revenue?period=quarterly&timeframe=365
```

### Customer Segmentation

```javascript
// Segment by engagement level
GET /admin/analytics/demographics?segmentBy=engagement

// Include inactive users in analysis
GET /admin/analytics/demographics?includeInactive=true
```

### Exporting Data

```javascript
// Export engagement data as CSV
GET /admin/analytics/export?type=engagement&format=csv&timeframe=30

// Export detailed revenue data as JSON
GET /admin/analytics/export?type=revenue&format=json&includeDetails=true
```

### Real-time Updates

```javascript
// Track user login
POST /admin/analytics/users/60f7b1c4e1234567890abcde/update
{
  "action": "login",
  "data": { "sessionDuration": 45 }
}

// Track feature usage
POST /admin/analytics/users/60f7b1c4e1234567890abcde/update
{
  "action": "featureUsage",
  "data": { "feature": "searchQueries", "incrementBy": 1 }
}

// Track search behavior
POST /admin/analytics/users/60f7b1c4e1234567890abcde/update
{
  "action": "search",
  "data": { "searchTerm": "crop rotation", "foundResults": true }
}
```

This comprehensive Analytics and Insights system provides SuperAdmins with complete visibility into user behavior, platform performance, revenue trends, and customer demographics, enabling data-driven decision making and platform optimization.
