# FamTech Admin - Complete User & SuperAdmin Management API

## Overview

This API provides comprehensive management functionality for both regular users and SuperAdmin accounts. The system now uses separate models for Users (farmers, advisors, viewers) and SuperAdmins (admin, superadmin) for better security and separation of concerns.

## Architecture Changes

- **User Model**: Handles regular platform users (farmers, advisors, viewers)
- **SuperAdmin Model**: Handles administrative users (admin, superadmin) with enhanced security features
- **Separate Authentication**: SuperAdmins have their own authentication system
- **Role-based Access**: Clear separation between user management and admin management

## Base URL

All endpoints are prefixed with: `/api/admin`

## User Types & Roles

### Regular Users (User Model)

- `farmer` - Regular farm users
- `advisor` - Agricultural advisors
- `viewer` - Read-only access users

### SuperAdmin Users (SuperAdmin Model)

- `admin` - Administrative users with user management permissions
- `superadmin` - Full system access including admin management

## User Status

- `active` - Approved and active accounts
- `inactive` - Rejected or deactivated accounts
- `pending` - Awaiting approval (Users only)
- `suspended` - Temporarily suspended accounts

---

## Authentication

### SuperAdmin Authentication

#### POST `/api/admin/auth/login`

Login SuperAdmin account.

**Request Body:**

```json
{
  "email": "admin@famtech.com",
  "password": "securePassword"
}
```

**Response:**

```json
{
  "message": "Login successful",
  "admin": {
    "id": "64a1b2c3d4e5f6789012345",
    "email": "admin@famtech.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "superadmin",
    "permissions": {
      "userManagement": true,
      "roleManagement": true,
      "systemSettings": true,
      "analytics": true,
      "bulkOperations": true
    },
    "lastLogin": "2025-09-22T10:30:00Z"
  }
}
```

#### POST `/api/admin/auth/register`

Register a new SuperAdmin (SuperAdmin only).

**Request Body:**

```json
{
  "email": "newadmin@famtech.com",
  "password": "securePassword",
  "firstName": "Jane",
  "lastName": "Smith",
  "phoneNumber": "+1234567890",
  "department": "IT Operations",
  "employeeId": "EMP001",
  "role": "admin",
  "notes": "New team member"
}
```

---

## SuperAdmin Management

#### GET `/api/admin/auth/profile`

Get current SuperAdmin profile.

#### PUT `/api/admin/auth/profile`

Update current SuperAdmin profile.

#### PUT `/api/admin/auth/password`

Change SuperAdmin password.

**Request Body:**

```json
{
  "currentPassword": "oldPassword",
  "newPassword": "newSecurePassword"
}
```

#### GET `/api/admin/admins`

Get all SuperAdmins with search and pagination (SuperAdmin only).

#### GET `/api/admin/admins/stats`

Get SuperAdmin statistics (SuperAdmin only).

#### PUT `/api/admin/admins/:adminId`

Update SuperAdmin role/status (SuperAdmin only).

#### DELETE `/api/admin/admins/:adminId`

Delete SuperAdmin account (SuperAdmin only).

---

## User Management

### User Statistics

#### GET `/api/admin/users/stats`

Get comprehensive user statistics.

**Response:**

```json
{
  "message": "User statistics retrieved successfully",
  "statistics": {
    "totalUsers": 150,
    "usersByStatus": {
      "active": 120,
      "inactive": 10,
      "pending": 15,
      "suspended": 5
    },
    "usersByRole": {
      "farmer": 100,
      "advisor": 40,
      "viewer": 10
    }
  }
}
```

### User Listing and Search

#### GET `/api/admin/users/search`

Search users with advanced filters and pagination.

**Query Parameters:**

- `page` (number, default: 1) - Page number
- `limit` (number, default: 10) - Items per page
- `sortBy` (string, default: 'createdAt') - Field to sort by
- `sortOrder` (string, default: 'desc') - Sort order (asc/desc)
- `search` (string) - Search in firstName, lastName, email
- `role` (string) - Filter by role (farmer, advisor, viewer)
- `status` (string) - Filter by status

#### GET `/api/admin/users/all`

Get all users (backward compatibility).

#### GET `/api/admin/users/pending`

Get all pending user registrations.

#### GET `/api/admin/users/role/:role`

Get users by specific role.

#### GET `/api/admin/users/:userId`

Get detailed user information.

### User Management Actions

#### POST `/api/admin/users/:userId/approve`

Approve a pending user registration.

#### POST `/api/admin/users/:userId/reject`

Reject a user registration.

**Request Body:**

```json
{
  "reason": "Incomplete documentation provided"
}
```

#### POST `/api/admin/users/:userId/suspend`

Suspend a user account.

#### POST `/api/admin/users/:userId/reactivate`

Reactivate a suspended user.

#### PUT `/api/admin/users/:userId/role`

Update user role.

**Request Body:**

```json
{
  "role": "advisor"
}
```

**Valid roles:** `farmer`, `advisor`, `viewer`

#### DELETE `/api/admin/users/:userId`

Delete user account (soft delete).

#### POST `/api/admin/users/bulk/approve`

Bulk approve multiple users.

**Request Body:**

```json
{
  "userIds": ["userId1", "userId2", "userId3"]
}
```

---

## Security Features

### SuperAdmin Security

- **Account Locking**: Automatic account lock after 5 failed login attempts
- **Password Security**: bcryptjs hashing with configurable salt rounds
- **Role-based Permissions**: Granular permission system
- **Audit Trail**: Complete tracking of admin actions
- **Session Management**: Refresh token rotation

### User Management Security

- **Approval Workflow**: All users require admin approval
- **Soft Delete**: Users are deactivated rather than permanently deleted
- **Action Logging**: All admin actions on users are logged
- **Role Restrictions**: Clear boundaries between user roles

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "message": "Error description",
  "error": "Detailed error message"
}
```

**Common HTTP Status Codes:**

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `423` - Locked (account locked due to failed login attempts)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## Usage Examples

### 1. SuperAdmin Login

```javascript
const response = await fetch("/api/admin/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "admin@famtech.com",
    password: "securePassword",
  }),
});
const data = await response.json();
```

### 2. Get User Statistics

```javascript
const response = await fetch("/api/admin/users/stats", {
  headers: { Authorization: "Bearer your-jwt-token" },
});
const { statistics } = await response.json();
```

### 3. Search Users

```javascript
const response = await fetch(
  "/api/admin/users/search?search=john&role=farmer&page=1&limit=10",
  {
    headers: { Authorization: "Bearer your-jwt-token" },
  }
);
const { data } = await response.json();
```

### 4. Approve User

```javascript
const response = await fetch(
  "/api/admin/users/64a1b2c3d4e5f6789012345/approve",
  {
    method: "POST",
    headers: { Authorization: "Bearer your-jwt-token" },
  }
);
```

### 5. Register New SuperAdmin

```javascript
const response = await fetch("/api/admin/auth/register", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer superadmin-jwt-token",
  },
  body: JSON.stringify({
    email: "newadmin@famtech.com",
    password: "securePassword",
    firstName: "Jane",
    lastName: "Doe",
    role: "admin",
  }),
});
```

---

## Database Schema

### SuperAdmin Model

```javascript
{
  // Authentication
  email: String (required, unique),
  passwordHash: String (required),

  // Profile
  firstName: String (required),
  lastName: String (required),
  phoneNumber: String,
  profilePicture: String,
  department: String,
  employeeId: String (unique),

  // System
  role: Enum ['admin', 'superadmin'],
  status: Enum ['active', 'inactive', 'suspended'],

  // Security
  lastLogin: Date,
  loginAttempts: Number,
  lockUntil: Date,
  isVerified: Boolean,
  verificationToken: String,
  refreshTokens: [String],
  passwordResetToken: String,
  passwordResetExpires: Date,

  // Permissions
  permissions: {
    userManagement: Boolean,
    roleManagement: Boolean,
    systemSettings: Boolean,
    analytics: Boolean,
    bulkOperations: Boolean
  },

  // Audit
  createdBy: ObjectId (ref: SuperAdmin),
  lastModifiedBy: ObjectId (ref: SuperAdmin),
  notes: String,

  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### User Model (Updated)

```javascript
{
  // Basic Information
  email: String (required, unique),
  passwordHash: String (required),
  firstName: String,
  lastName: String,
  phoneNumber: String,
  profilePicture: String,

  // System Fields
  role: Enum ['farmer', 'advisor', 'viewer'], // Removed admin roles
  status: Enum ['active', 'inactive', 'pending', 'suspended'],
  region: String (required),
  language: String (default: 'en'),

  // Verification & Security
  isVerified: Boolean (default: false),
  verificationToken: String,
  refreshTokens: [String],
  passwordResetToken: String,
  passwordResetExpires: Date,

  // Admin Actions (now reference SuperAdmin)
  lastLogin: Date,
  approvedBy: ObjectId (ref: SuperAdmin),
  approvedAt: Date,
  rejectedBy: ObjectId (ref: SuperAdmin),
  rejectedAt: Date,
  rejectionReason: String,

  // Relations
  WeatherInfo: ObjectId (ref: WeatherForecast),
  farmAssets: [ObjectId] (ref: FarmAsset),

  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

---

This updated architecture provides better security, clearer separation of concerns, and improved scalability for the FamTech admin system.
