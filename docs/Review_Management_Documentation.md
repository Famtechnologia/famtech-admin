# Review and Rating Management System Documentation

## Overview

The Review and Rating Management system provides comprehensive functionality for SuperAdmins to manage user reviews and ratings across the platform. This includes review moderation, statistics tracking, admin responses, and bulk operations.

## Features Implemented

### 1. Review Statistics & Dashboard

- **Total number of reviews** - Overall count and filtered counts
- **Average rating** - Platform-wide and filtered average ratings
- **Rating distribution** - Breakdown of reviews by rating (1-5 stars)
- **Status distribution** - Count of pending, approved, rejected, flagged, and hidden reviews
- **Review type distribution** - Breakdown by service, product, platform, advisor, general reviews
- **Trending insights** - Daily review counts, top reviewers, most reviewed targets

### 2. Review Filtering and Sorting

- **Search functionality** - Text search across review titles, comments, reviewer names, and target names
- **Filter by rating** - Show only reviews with specific rating (1-5)
- **Filter by status** - pending, approved, rejected, flagged, hidden
- **Filter by review type** - service, product, platform, advisor, general
- **Filter by target type** - user, service, product, platform
- **Date range filtering** - Reviews within specific date ranges
- **Admin response filter** - Reviews with or without admin responses
- **Sorting options** - By date, rating, status, review type, helpful count

### 3. Review Moderation

- **Approve reviews** - Mark reviews as approved for public display
- **Reject reviews** - Mark reviews as rejected with mandatory reason
- **Flag reviews** - Mark for further investigation with reason
- **Hide reviews** - Hide from public view with reason
- **Moderation tracking** - Track who moderated and when
- **Bulk operations** - Perform actions on multiple reviews simultaneously

### 4. Admin Response System

- **Add responses** - SuperAdmins can respond to reviews
- **Update responses** - Modify existing admin responses
- **Remove responses** - Delete admin responses
- **Public/Private responses** - Control visibility of responses
- **Response tracking** - Track who responded and when

### 5. Advanced Features

- **Review details view** - Complete review information with user and moderation details
- **Reviews by target** - Get all reviews for specific users, services, or products
- **Data export** - Export review data in CSV or JSON format
- **Permanent deletion** - SuperAdmin-only ability to permanently delete reviews
- **Rate limiting** - Prevent abuse of bulk operations
- **Comprehensive validation** - Input validation for all operations

## Database Schema

### Review Model Structure

```javascript
{
  // Review Content
  rating: Number (1-5, required),
  title: String (optional, max 100 chars),
  comment: String (required, 5-1000 chars),
  reviewType: String (enum: service/product/platform/advisor/general),

  // User Information
  reviewerId: ObjectId (ref: User),
  reviewerName: String,
  reviewerEmail: String,

  // Target Information
  targetType: String (enum: user/service/product/platform),
  targetId: ObjectId,
  targetModel: String,
  targetName: String,

  // Moderation
  status: String (enum: pending/approved/rejected/flagged/hidden),
  moderationReason: String,
  moderatedBy: ObjectId (ref: SuperAdmin),
  moderatedAt: Date,

  // Admin Response
  adminResponse: {
    responseText: String,
    respondedBy: ObjectId (ref: SuperAdmin),
    respondedAt: Date,
    isPublic: Boolean
  },

  // Metrics
  helpfulCount: Number,
  reportCount: Number,

  // Metadata
  reviewSource: String,
  ipAddress: String,
  userAgent: String,
  timestamps: true
}
```

## API Endpoints

### Dashboard & Statistics

```
GET /admin/reviews/dashboard?timeframe=30
- Get review statistics and dashboard data
- Query params: timeframe (days or 'all')
- Returns: overview stats, pending/flagged reviews, trends
```

### Review Management

```
GET /admin/reviews
- Get all reviews with filtering and pagination
- Query params: page, limit, sortBy, sortOrder, search, rating, status, reviewType, targetType, dateFrom, dateTo, hasAdminResponse
- Returns: paginated reviews with search results

GET /admin/reviews/:reviewId
- Get single review details
- Returns: complete review information with user and admin details

PUT /admin/reviews/:reviewId/approve
- Approve a review
- Body: { reason?: string }
- Returns: updated review

PUT /admin/reviews/:reviewId/reject
- Reject a review
- Body: { reason: string } (required)
- Returns: updated review

PUT /admin/reviews/:reviewId/flag
- Flag a review for investigation
- Body: { reason: string } (required)
- Returns: updated review

PUT /admin/reviews/:reviewId/hide
- Hide a review from public view
- Body: { reason: string } (required)
- Returns: updated review
```

### Admin Responses

```
POST /admin/reviews/:reviewId/response
- Add admin response to review
- Body: { responseText: string, isPublic?: boolean }
- Returns: review with admin response

PUT /admin/reviews/:reviewId/response
- Update existing admin response
- Body: { responseText: string, isPublic?: boolean }
- Returns: updated review with response

DELETE /admin/reviews/:reviewId/response
- Remove admin response
- Returns: review without response
```

### Bulk Operations

```
POST /admin/reviews/bulk/actions
- Perform bulk actions on multiple reviews
- Body: { action: string, reviewIds: string[], reason?: string }
- Actions: approve, reject, flag, hide
- Returns: results for each review
```

### Target-Specific Reviews

```
GET /admin/reviews/target/:targetType/:targetId
- Get reviews for specific target
- Params: targetType (user/service/product/platform), targetId
- Query params: page, limit, sortBy, sortOrder, status
- Returns: reviews and statistics for target
```

### Data Management

```
DELETE /admin/reviews/:reviewId
- Permanently delete review (SuperAdmin only)
- Body: { confirmDelete: true }
- Returns: deleted review data

GET /admin/reviews/export
- Export reviews data
- Query params: format (csv/json), status, dateFrom, dateTo, includeResponses
- Returns: CSV file download or JSON data
```

## Security & Validation

### Access Control

- **Admin Role Required** - All endpoints require admin authentication
- **SuperAdmin Only** - Permanent deletion restricted to SuperAdmins
- **Rate Limiting** - Bulk operations limited to prevent abuse

### Input Validation

- **Review Data** - Rating (1-5), comment length (5-1000 chars), valid enums
- **Admin Response** - Response length (5-1000 chars), boolean validation
- **Bulk Actions** - Valid action types, ID format validation, reason requirements
- **Filters** - Date format, enum validation, range limits
- **Target Validation** - Valid target types and ID formats

### Data Protection

- **Sensitive Data Filtering** - IP addresses and user agents excluded from responses
- **Audit Trail** - All moderation actions tracked with admin ID and timestamp
- **Soft Deletion** - Reviews typically hidden rather than permanently deleted

## Usage Examples

### Getting Review Dashboard

```javascript
// Get last 30 days review statistics
GET /admin/reviews/dashboard?timeframe=30

Response:
{
  "success": true,
  "data": {
    "overview": {
      "totalReviews": 1250,
      "averageRating": 4.2,
      "ratingDistribution": { "1": 50, "2": 75, "3": 200, "4": 400, "5": 525 },
      "statusDistribution": { "pending": 25, "approved": 1100, "rejected": 75, "flagged": 35, "hidden": 15 }
    },
    "pendingReviews": [...],
    "flaggedReviews": [...],
    "trends": { ... }
  }
}
```

### Searching Reviews

```javascript
// Search for reviews containing "excellent" with 5-star rating
GET /admin/reviews?search=excellent&rating=5&page=1&limit=20&sortBy=createdAt&sortOrder=desc

Response:
{
  "success": true,
  "data": {
    "reviews": [...],
    "pagination": {
      "current": 1,
      "pages": 5,
      "total": 85,
      "limit": 20
    }
  }
}
```

### Bulk Review Moderation

```javascript
// Approve multiple reviews
POST /admin/reviews/bulk/actions
{
  "action": "approve",
  "reviewIds": ["60f7b1c4e1234567890abcde", "60f7b1c4e1234567890abcdf"],
  "reason": "Reviews meet community guidelines"
}

Response:
{
  "success": true,
  "message": "Bulk approve completed. 2 successful, 0 failed.",
  "data": {
    "results": [
      { "reviewId": "60f7b1c4e1234567890abcde", "success": true },
      { "reviewId": "60f7b1c4e1234567890abcdf", "success": true }
    ]
  }
}
```

### Adding Admin Response

```javascript
// Add public admin response to review
POST /admin/reviews/60f7b1c4e1234567890abcde/response
{
  "responseText": "Thank you for your feedback. We're glad you had a positive experience!",
  "isPublic": true
}

Response:
{
  "success": true,
  "message": "Admin response added successfully",
  "data": {
    "review": {
      // Review with admin response populated
    }
  }
}
```

## Integration Notes

### With User Management System

- Reviews are linked to User model via `reviewerId`
- User approval status affects review visibility
- SuperAdmin moderation references both User and SuperAdmin models

### With Authentication System

- All endpoints require admin authentication middleware
- Admin ID automatically captured from authenticated session
- Role-based access control enforced

### Database Optimization

- Comprehensive indexing for search performance
- Text indexes for full-text search capabilities
- Compound indexes for common query patterns

## Future Enhancements

### Possible Extensions

1. **Review Analytics** - Advanced reporting and trend analysis
2. **Automated Moderation** - AI-powered content filtering
3. **Review Templates** - Pre-defined admin response templates
4. **Email Notifications** - Notify users of admin responses
5. **Review Verification** - Verify authentic user experiences
6. **Sentiment Analysis** - Automatic sentiment scoring
7. **Review Clustering** - Group similar reviews for batch processing

### Performance Improvements

1. **Caching Layer** - Redis caching for frequently accessed statistics
2. **Background Processing** - Queue-based bulk operations
3. **Search Optimization** - Elasticsearch integration for advanced search
4. **Data Archiving** - Archive old reviews to improve query performance

This comprehensive Review and Rating Management system provides SuperAdmins with all the tools needed to effectively moderate, analyze, and respond to user reviews across the platform.
