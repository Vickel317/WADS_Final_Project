# Academify API Documentation

Welcome to the Academify API documentation! This comprehensive guide covers all available endpoints for the Academify platform.

## Quick Links

- **Interactive Documentation**: Visit [http://localhost:3000/api-docs](http://localhost:3000/api-docs) to explore the API with Swagger UI
- **OpenAPI Spec**: [/public/swagger.json](/public/swagger.json)

## Base URL

```
http://localhost:3000/api
```

## Authentication

The API uses JWT (JSON Web Token) for authentication. After logging in, you'll receive a token that must be included in the `Authorization` header for protected endpoints.

### Authentication Header Format

```
Authorization: Bearer <your_jwt_token>
```

### Cookie-based Authentication

Alternatively, the `auth_token` is set as an HTTP-only cookie during login, which is automatically included in requests.

## API Endpoints

### Authentication Endpoints

#### 1. Register a New Account
```
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

**Success Response (201):**
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2026-03-11T10:00:00Z"
}
```

#### 2. Login
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Note:** The response includes an HTTP-only `auth_token` cookie.

#### 3. Get Current User
```
GET /api/auth/me
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "student",
  "createdAt": "2026-03-11T10:00:00Z",
  "updatedAt": "2026-03-11T15:00:00Z"
}
```

#### 4. Logout
```
POST /api/auth/logout
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

**Note:** The `auth_token` cookie is cleared automatically.

#### 5. Refresh Access Token
```
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

### User Endpoints

#### 1. Get User Profile
```
GET /api/users/:userId
```

**Parameters:**
- `userId` (path, required): User ID (e.g., "user_1")

**Success Response (200):**
```json
{
  "id": "user_1",
  "email": "john@example.com",
  "name": "John Doe",
  "role": "student",
  "bio": "Computer Science student",
  "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
  "createdAt": "2026-01-15T10:00:00Z",
  "updatedAt": "2026-03-10T15:00:00Z"
}
```

#### 2. Update Own Profile
```
PUT /api/users/:userId
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "bio": "Updated bio text",
  "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=newavatar"
}
```

**Note:** Users can only update their own profile. The `userId` in the URL must match the authenticated user's ID.

**Success Response (200):**
```json
{
  "id": "user_1",
  "email": "john@example.com",
  "name": "John Doe Updated",
  "role": "student",
  "bio": "Updated bio text",
  "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=newavatar",
  "createdAt": "2026-01-15T10:00:00Z",
  "updatedAt": "2026-03-11T12:00:00Z"
}
```

#### 3. Delete Own Account
```
DELETE /api/users/:userId
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Note:** Users can only delete their own account. The `userId` in the URL must match the authenticated user's ID.

**Success Response (200):**
```json
{
  "message": "Account deleted successfully"
}
```

#### 4. Get User's Posts
```
GET /api/users/:userId/posts
```

**Parameters:**
- `userId` (path, required): User ID

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "post_1",
      "userId": "user_1",
      "title": "Advanced JavaScript Patterns",
      "content": "A comprehensive guide to design patterns...",
      "category": "Technology",
      "createdAt": "2026-03-05T10:00:00Z",
      "updatedAt": "2026-03-05T10:00:00Z",
      "likes": 42,
      "comments": 8
    }
  ],
  "total": 1,
  "userId": "user_1"
}
```

#### 5. Get User's Events
```
GET /api/users/:userId/events
```

**Parameters:**
- `userId` (path, required): User ID
- `status` (query, optional): Filter by status - "scheduled", "completed", or "cancelled"

**Query Example:**
```
GET /api/users/user_1/events?status=scheduled
```

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "event_1",
      "userId": "user_1",
      "title": "JavaScript Study Session",
      "description": "Advanced JavaScript patterns and best practices discussion",
      "date": "2026-03-15T14:00:00Z",
      "duration": 120,
      "location": "Library - Room 301",
      "category": "Study Session",
      "participants": ["user_1", "user_3", "user_4"],
      "status": "scheduled"
    }
  ],
  "total": 1,
  "userId": "user_1"
}
```

### Event Endpoints

#### 1. List Events
```
GET /api/events
```

**Query Parameters:**
- `filter` (optional): "upcoming" or "past" - Filter events by date
- `page` (optional): Page number (default: 1)

**Query Examples:**
```
GET /api/events
GET /api/events?filter=upcoming
GET /api/events?filter=upcoming&page=2
```

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "event_1",
      "userId": "user_1",
      "title": "JavaScript Study Session",
      "description": "Advanced JavaScript patterns discussion",
      "date": "2026-03-15T14:00:00Z",
      "duration": 120,
      "location": "Library - Room 301",
      "category": "Study Session",
      "maxAttendees": 20,
      "attendees": ["user_1", "user_3", "user_4"],
      "status": "scheduled",
      "createdAt": "2026-03-10T10:00:00Z",
      "updatedAt": "2026-03-10T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

#### 2. Get Event Details with Attendees
```
GET /api/events/:eventId
```

**Parameters:**
- `eventId` (path, required): Event ID

**Success Response (200):**
```json
{
  "id": "event_1",
  "userId": "user_1",
  "title": "JavaScript Study Session",
  "description": "Advanced JavaScript patterns discussion",
  "date": "2026-03-15T14:00:00Z",
  "duration": 120,
  "location": "Library - Room 301",
  "category": "Study Session",
  "maxAttendees": 20,
  "attendees": ["user_1", "user_3", "user_4"],
  "status": "scheduled",
  "createdAt": "2026-03-10T10:00:00Z",
  "updatedAt": "2026-03-10T10:00:00Z"
}
```

#### 3. Create New Event
```
POST /api/events
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "title": "Python Workshop",
  "description": "Interactive Python programming workshop",
  "date": "2026-03-25T18:00:00Z",
  "duration": 180,
  "location": "Computer Lab - Building A",
  "category": "Workshop",
  "maxAttendees": 30
}
```

**Success Response (201):**
```json
{
  "id": "event_999",
  "userId": "user_1",
  "title": "Python Workshop",
  "description": "Interactive Python programming workshop",
  "date": "2026-03-25T18:00:00Z",
  "duration": 180,
  "location": "Computer Lab - Building A",
  "category": "Workshop",
  "maxAttendees": 30,
  "attendees": ["user_1"],
  "status": "scheduled",
  "createdAt": "2026-03-11T10:00:00Z",
  "updatedAt": "2026-03-11T10:00:00Z"
}
```

#### 4. Update Own Event
```
PUT /api/events/:eventId
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Parameters:**
- `eventId` (path, required): Event ID (must be creator's event)

**Request Body:**
```json
{
  "title": "JavaScript Study Session - Updated",
  "description": "Updated description",
  "maxAttendees": 25,
  "status": "completed"
}
```

**Note:** Users can only update their own events.

**Success Response (200):**
```json
{
  "id": "event_1",
  "userId": "user_1",
  "title": "JavaScript Study Session - Updated",
  "description": "Updated description",
  "date": "2026-03-15T14:00:00Z",
  "duration": 120,
  "location": "Library - Room 301",
  "category": "Study Session",
  "maxAttendees": 25,
  "attendees": ["user_1", "user_3", "user_4"],
  "status": "completed",
  "createdAt": "2026-03-10T10:00:00Z",
  "updatedAt": "2026-03-11T12:00:00Z"
}
```

#### 5. Delete Own Event
```
DELETE /api/events/:eventId
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Parameters:**
- `eventId` (path, required): Event ID (must be creator's event)

**Note:** Users can only delete their own events.

**Success Response (200):**
```json
{
  "message": "Event deleted successfully"
}
```

#### 6. RSVP to Event
```
POST /api/events/:eventId/rsvp
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Parameters:**
- `eventId` (path, required): Event ID to attend

**Success Response (200):**
```json
{
  "message": "Successfully RSVP'd to event",
  "event": {
    "id": "event_1",
    "userId": "user_1",
    "title": "JavaScript Study Session",
    "description": "Advanced JavaScript patterns discussion",
    "date": "2026-03-15T14:00:00Z",
    "duration": 120,
    "location": "Library - Room 301",
    "category": "Study Session",
    "maxAttendees": 20,
    "attendees": ["user_1", "user_3", "user_4", "user_6"],
    "status": "scheduled",
    "createdAt": "2026-03-10T10:00:00Z",
    "updatedAt": "2026-03-11T12:00:00Z"
  }
}
```

**Error Scenarios:**
- **400**: Already attending or event at full capacity
- **404**: Event not found
- **401**: Not authenticated

#### 7. Cancel RSVP
```
DELETE /api/events/:eventId/rsvp
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Parameters:**
- `eventId` (path, required): Event ID to cancel attendance

**Success Response (200):**
```json
{
  "message": "Successfully cancelled RSVP",
  "event": {
    "id": "event_1",
    "userId": "user_1",
    "title": "JavaScript Study Session",
    "description": "Advanced JavaScript patterns discussion",
    "date": "2026-03-15T14:00:00Z",
    "duration": 120,
    "location": "Library - Room 301",
    "category": "Study Session",
    "maxAttendees": 20,
    "attendees": ["user_1", "user_3", "user_4"],
    "status": "scheduled",
    "createdAt": "2026-03-10T10:00:00Z",
    "updatedAt": "2026-03-11T12:00:00Z"
  }
}
```

**Error Scenarios:**
- **400**: Not attending this event
- **404**: Event not found
- **401**: Not authenticated

#### 8. Get Attendee List
```
GET /api/events/:eventId/attendees
```

**Parameters:**
- `eventId` (path, required): Event ID

**Success Response (200):**
```json
{
  "eventId": "event_1",
  "eventTitle": "JavaScript Study Session",
  "totalAttendees": 3,
  "maxAttendees": 20,
  "attendees": [
    {
      "id": "user_1",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=john"
    },
    {
      "id": "user_3",
      "name": "Mike Johnson",
      "email": "mike@example.com",
      "role": "student",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=mike"
    },
    {
      "id": "user_4",
      "name": "Emma Wilson",
      "email": "emma@example.com",
      "role": "student",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=emma"
    }
  ]
}
```

## Error Responses

All error responses follow a consistent format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request body or missing required fields
- **401 Unauthorized**: Missing or invalid authentication token
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side error

## Rate Limiting

Currently, there are no rate limits implemented. In production, you should implement appropriate rate limiting to prevent abuse.

## CORS Policy

The API accepts requests from:
- `http://localhost:3000` (development)
- `https://academify.example.com` (production)

## Testing the API

### Using cURL

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "name": "John Doe"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'

# Get current user (replace TOKEN with your JWT)
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer TOKEN"

# Get user profile
curl -X GET http://localhost:3000/api/users/user_1

# Update user profile (replace TOKEN with your JWT)
curl -X PUT http://localhost:3000/api/users/user_1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "name": "John Doe Updated",
    "bio": "Updated bio",
    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=newavatar"
  }'

# Get user's posts
curl -X GET http://localhost:3000/api/users/user_1/posts

# Get user's events
curl -X GET http://localhost:3000/api/users/user_1/events

# Get user's scheduled events only
curl -X GET http://localhost:3000/api/users/user_1/events?status=scheduled

# Delete user account (replace TOKEN with your JWT)
curl -X DELETE http://localhost:3000/api/users/user_1 \
  -H "Authorization: Bearer TOKEN"

# List all upcoming events
curl -X GET http://localhost:3000/api/events?filter=upcoming

# Get specific event details
curl -X GET http://localhost:3000/api/events/event_1

# Create a new event (replace TOKEN with your JWT)
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "title": "Python Workshop",
    "description": "Interactive Python programming workshop",
    "date": "2026-03-25T18:00:00Z",
    "duration": 180,
    "location": "Computer Lab",
    "category": "Workshop",
    "maxAttendees": 30
  }'

# Update an event (replace TOKEN and event_1 with your JWT and event ID)
curl -X PUT http://localhost:3000/api/events/event_1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "maxAttendees": 25,
    "status": "completed"
  }'

# RSVP to an event (replace TOKEN with your JWT)
curl -X POST http://localhost:3000/api/events/event_1/rsvp \
  -H "Authorization: Bearer TOKEN"

# Cancel RSVP (replace TOKEN with your JWT)
curl -X DELETE http://localhost:3000/api/events/event_1/rsvp \
  -H "Authorization: Bearer TOKEN"

# Get attendee list for an event
curl -X GET http://localhost:3000/api/events/event_1/attendees

# Delete an event (replace TOKEN and event_1 with your JWT and event ID)
curl -X DELETE http://localhost:3000/api/events/event_1 \
  -H "Authorization: Bearer TOKEN"
```

### Using Swagger UI

1. Navigate to [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
2. Click on an endpoint to expand it
3. Click "Try it out" button
4. Fill in the required parameters
5. Click "Execute" to send the request

## Security Considerations

1. **JWT Expiration**: All tokens expire after 1 hour
2. **Password Hashing**: Passwords are hashed using bcryptjs (10 salt rounds)
3. **HTTP-only Cookies**: Authentication cookies are HTTP-only and cannot be accessed by JavaScript
4. **HTTPS Only**: In production, all cookies are `Secure` (HTTPS only)
5. **CSRF Protection**: Use SameSite cookie attributes set to "strict"

## Future Endpoints

Coming soon:
- Forum discussions and threads
- Direct messaging
- File uploads and sharing

## Support

For API issues or questions, please contact: support@academify.com

---

**Last Updated:** March 11, 2026
**API Version:** 1.0.0
