# Review Management System - Quick Setup Guide

## Testing the Review and Rating Management Features

### Prerequisites

1. **Database Setup**: Ensure MongoDB is running and connected
2. **Admin Authentication**: Have SuperAdmin account created and authenticated
3. **Sample Data**: Create some sample reviews for testing (optional)

### 1. Test Review Dashboard

```bash
# Get review statistics dashboard
curl -X GET "http://localhost:3000/admin/reviews/dashboard?timeframe=30" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### 2. Test Review Listing with Filters

```bash
# Get all reviews with pagination
curl -X GET "http://localhost:3000/admin/reviews?page=1&limit=10&sortBy=createdAt&sortOrder=desc" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Search reviews by rating and status
curl -X GET "http://localhost:3000/admin/reviews?rating=5&status=pending&search=excellent" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 3. Test Review Moderation

```bash
# Approve a review
curl -X PUT "http://localhost:3000/admin/reviews/REVIEW_ID/approve" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Meets community guidelines"}'

# Reject a review
curl -X PUT "http://localhost:3000/admin/reviews/REVIEW_ID/reject" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Contains inappropriate content"}'

# Flag a review
curl -X PUT "http://localhost:3000/admin/reviews/REVIEW_ID/flag" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Needs further investigation"}'
```

### 4. Test Admin Responses

```bash
# Add admin response
curl -X POST "http://localhost:3000/admin/reviews/REVIEW_ID/response" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "responseText": "Thank you for your feedback. We appreciate your input!",
    "isPublic": true
  }'

# Update admin response
curl -X PUT "http://localhost:3000/admin/reviews/REVIEW_ID/response" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "responseText": "Updated response: Thank you for the clarification.",
    "isPublic": true
  }'
```

### 5. Test Bulk Operations

```bash
# Bulk approve reviews
curl -X POST "http://localhost:3000/admin/reviews/bulk/actions" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve",
    "reviewIds": ["REVIEW_ID_1", "REVIEW_ID_2", "REVIEW_ID_3"],
    "reason": "Batch approval for compliant reviews"
  }'
```

### 6. Test Data Export

```bash
# Export reviews as CSV
curl -X GET "http://localhost:3000/admin/reviews/export?format=csv&status=approved&includeResponses=true" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -o reviews_export.csv

# Export as JSON
curl -X GET "http://localhost:3000/admin/reviews/export?format=json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -o reviews_export.json
```

## Sample Review Data for Testing

If you need sample data, you can create reviews directly in MongoDB:

```javascript
// Sample reviews to insert in MongoDB
db.reviews.insertMany([
  {
    rating: 5,
    title: "Excellent Service",
    comment: "The platform exceeded my expectations. Great user experience!",
    reviewType: "platform",
    reviewerId: ObjectId("USER_ID_HERE"),
    reviewerName: "John Doe",
    reviewerEmail: "john@example.com",
    targetType: "platform",
    targetName: "FarmTech Platform",
    status: "pending",
    reviewSource: "web",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    rating: 4,
    title: "Good Platform",
    comment: "Overall good experience with minor improvements needed.",
    reviewType: "platform",
    reviewerId: ObjectId("USER_ID_HERE"),
    reviewerName: "Jane Smith",
    reviewerEmail: "jane@example.com",
    targetType: "platform",
    targetName: "FarmTech Platform",
    status: "approved",
    reviewSource: "mobile",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    rating: 2,
    title: "Needs Improvement",
    comment:
      "The service was disappointing and needs significant improvements.",
    reviewType: "service",
    reviewerId: ObjectId("USER_ID_HERE"),
    reviewerName: "Bob Wilson",
    reviewerEmail: "bob@example.com",
    targetType: "service",
    targetName: "Consulting Service",
    status: "flagged",
    moderationReason: "Negative feedback requires investigation",
    reviewSource: "web",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);
```

## Testing Validation

### Test Validation Errors

```bash
# Test invalid rating
curl -X PUT "http://localhost:3000/admin/reviews/INVALID_ID/approve" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
# Should return 400 - Invalid ID format

# Test missing reason for rejection
curl -X PUT "http://localhost:3000/admin/reviews/REVIEW_ID/reject" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
# Should return 400 - Reason required

# Test invalid bulk action
curl -X POST "http://localhost:3000/admin/reviews/bulk/actions" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "invalid_action",
    "reviewIds": ["REVIEW_ID"]
  }'
# Should return 400 - Invalid action
```

## Expected Response Formats

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Operation failed",
  "error": "Detailed error message",
  "errors": ["Array of validation errors"] // For validation failures
}
```

## Monitoring and Troubleshooting

### Common Issues

1. **Authentication Errors**: Ensure valid admin token in Authorization header
2. **Invalid IDs**: Use valid MongoDB ObjectId format (24 character hex string)
3. **Validation Failures**: Check required fields and data types
4. **Rate Limiting**: Don't exceed 5 bulk operations per minute

### Debug Tips

1. Check server logs for detailed error messages
2. Verify MongoDB connection and collections exist
3. Ensure Review model is properly imported and registered
4. Test individual endpoints before bulk operations

This setup guide provides a comprehensive testing framework for the Review and Rating Management system.
