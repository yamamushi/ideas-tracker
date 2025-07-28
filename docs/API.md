# API Documentation

This document provides comprehensive documentation for the Ideas Tracker REST API.

## Table of Contents
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)
  - [Authentication](#authentication-endpoints)
  - [Ideas](#ideas-endpoints)
  - [Voting](#voting-endpoints)
  - [Comments](#comments-endpoints)
  - [Users](#users-endpoints)
  - [Admin](#admin-endpoints)
  - [Configuration](#configuration-endpoints)

## Base URL

```
http://localhost:3001/api
```

For production, replace with your actual domain.

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Tokens are provided upon successful login/registration.

### Token Types
- **Access Token**: Short-lived (15 minutes), used for API requests
- **Refresh Token**: Long-lived (7 days), used to obtain new access tokens

### Using Tokens
Include the access token in the Authorization header:

```http
Authorization: Bearer <access_token>
```

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": [] // Optional validation details
  }
}
```

## Error Handling

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

### Common Error Codes
- `VALIDATION_ERROR` - Input validation failed
- `AUTH_REQUIRED` - Authentication required
- `ACCESS_DENIED` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `RATE_LIMITED` - Too many requests

## Rate Limiting

API endpoints are rate limited to prevent abuse:
- **Default**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per 15 minutes per IP
- **Comment Creation**: 10 requests per 15 minutes per user

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Endpoints

## Authentication Endpoints

### Register User
Create a new user account.

```http
POST /auth/register
```

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Validation Rules:**
- `username`: 3-50 characters, alphanumeric and underscores only
- `email`: Valid email format, unique
- `password`: 8-100 characters, at least one letter and one number

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "isAdmin": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

### Login User
Authenticate an existing user.

```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "isAdmin": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

### Refresh Token
Get a new access token using a refresh token.

```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

### Logout User
Invalidate refresh token.

```http
POST /auth/logout
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

## Ideas Endpoints

### Get Ideas
Retrieve ideas with filtering, sorting, and pagination.

```http
GET /ideas
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `sortBy` (string): Sort field (`votes`, `date`, `alphabetical`)
- `sortOrder` (string): Sort order (`asc`, `desc`)
- `tags` (string[]): Filter by tags
- `search` (string): Search in title and description
- `authorId` (number): Filter by author

**Example:**
```http
GET /ideas?page=1&limit=20&sortBy=votes&sortOrder=desc&tags=technology&tags=innovation&search=AI
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ideas": [
      {
        "id": 1,
        "title": "AI-Powered Code Review",
        "description": "An intelligent system that automatically reviews code...",
        "authorId": 1,
        "author": {
          "id": 1,
          "username": "johndoe",
          "email": "john@example.com",
          "isAdmin": false,
          "createdAt": "2024-01-01T00:00:00.000Z"
        },
        "tags": ["technology", "innovation"],
        "voteCount": 15,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### Get Idea by ID
Retrieve a specific idea.

```http
GET /ideas/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "idea": {
      "id": 1,
      "title": "AI-Powered Code Review",
      "description": "An intelligent system that automatically reviews code...",
      "authorId": 1,
      "author": {
        "id": 1,
        "username": "johndoe",
        "email": "john@example.com",
        "isAdmin": false,
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      "tags": ["technology", "innovation"],
      "voteCount": 15,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Create Idea
Create a new idea (requires authentication).

```http
POST /ideas
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "title": "AI-Powered Code Review",
  "description": "An intelligent system that automatically reviews code for bugs, security issues, and best practices.",
  "tags": ["technology", "innovation"]
}
```

**Validation Rules:**
- `title`: 5-200 characters, required
- `description`: 10-2000 characters, required
- `tags`: Array of valid tag IDs, 1-5 tags required

**Response:**
```json
{
  "success": true,
  "message": "Idea created successfully",
  "data": {
    "idea": {
      "id": 1,
      "title": "AI-Powered Code Review",
      "description": "An intelligent system that automatically reviews code...",
      "authorId": 1,
      "author": {
        "id": 1,
        "username": "johndoe",
        "email": "john@example.com",
        "isAdmin": false,
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      "tags": ["technology", "innovation"],
      "voteCount": 0,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Update Idea
Update an existing idea (author only).

```http
PUT /ideas/:id
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "title": "Updated AI-Powered Code Review",
  "description": "Updated description...",
  "tags": ["technology", "innovation", "ai"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Idea updated successfully",
  "data": {
    "idea": {
      // Updated idea object
    }
  }
}
```

### Delete Idea
Delete an idea (author or admin only).

```http
DELETE /ideas/:id
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Idea deleted successfully"
}
```

## Voting Endpoints

### Cast Vote
Cast or change a vote on an idea.

```http
POST /ideas/:id/vote
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "voteType": "upvote"
}
```

**Vote Types:**
- `upvote`: Positive vote
- `downvote`: Negative vote

**Response:**
```json
{
  "success": true,
  "message": "Vote cast successfully",
  "data": {
    "voteStats": {
      "upvotes": 16,
      "downvotes": 3,
      "total": 13,
      "userVote": "upvote"
    }
  }
}
```

### Remove Vote
Remove your vote from an idea.

```http
DELETE /ideas/:id/vote
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Vote removed successfully",
  "data": {
    "voteStats": {
      "upvotes": 15,
      "downvotes": 3,
      "total": 12,
      "userVote": null
    }
  }
}
```

### Get Vote Stats
Get voting statistics for an idea.

```http
GET /ideas/:id/votes
```

**Response:**
```json
{
  "success": true,
  "data": {
    "voteStats": {
      "upvotes": 15,
      "downvotes": 3,
      "total": 12,
      "userVote": "upvote"
    }
  }
}
```

## Comments Endpoints

### Get Comments
Get comments for an idea.

```http
GET /comments/idea/:ideaId
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 50, max: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": 1,
        "content": "Great idea! I think this could really help developers.",
        "authorId": 2,
        "author": {
          "id": 2,
          "username": "janedoe",
          "email": "jane@example.com",
          "isAdmin": false,
          "createdAt": "2024-01-01T00:00:00.000Z"
        },
        "ideaId": 1,
        "createdAt": "2024-01-01T01:00:00.000Z",
        "updatedAt": "2024-01-01T01:00:00.000Z"
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

### Create Comment
Add a comment to an idea.

```http
POST /comments/idea/:ideaId
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "content": "Great idea! I think this could really help developers."
}
```

**Validation Rules:**
- `content`: 1-1000 characters, required

**Response:**
```json
{
  "success": true,
  "message": "Comment created successfully",
  "data": {
    "comment": {
      "id": 1,
      "content": "Great idea! I think this could really help developers.",
      "authorId": 2,
      "author": {
        "id": 2,
        "username": "janedoe",
        "email": "jane@example.com",
        "isAdmin": false,
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      "ideaId": 1,
      "createdAt": "2024-01-01T01:00:00.000Z",
      "updatedAt": "2024-01-01T01:00:00.000Z"
    }
  }
}
```

### Update Comment
Update a comment (author only).

```http
PUT /comments/:id
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "content": "Updated comment content."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Comment updated successfully",
  "data": {
    "comment": {
      // Updated comment object
    }
  }
}
```

### Delete Comment
Delete a comment (author or admin only).

```http
DELETE /comments/:id
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

### Get Comment Count
Get the number of comments for an idea.

```http
GET /comments/idea/:ideaId/count
```

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

## Users Endpoints

### Get Current User
Get the authenticated user's profile.

```http
GET /users/me
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "isAdmin": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Get User Profile
Get a user's public profile.

```http
GET /users/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "isAdmin": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "stats": {
      "totalIdeas": 5,
      "totalVotes": 23,
      "totalComments": 12
    }
  }
}
```

### Get User Ideas
Get ideas created by a specific user.

```http
GET /ideas/user/:userId
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `sortBy` (string): Sort field (`votes`, `date`)
- `sortOrder` (string): Sort order (`asc`, `desc`)

**Response:**
```json
{
  "success": true,
  "data": {
    "ideas": [
      // Array of idea objects
    ],
    "total": 5,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

## Admin Endpoints

All admin endpoints require authentication and admin privileges.

### Delete Idea (Admin)
Delete any idea as an admin.

```http
DELETE /admin/ideas/:id
```

**Headers:**
```http
Authorization: Bearer <admin_access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Idea deleted successfully",
  "data": {
    "deletedIdea": {
      "id": 1,
      "title": "Deleted Idea Title",
      "author": "username"
    }
  }
}
```

### Delete Comment (Admin)
Delete any comment as an admin.

```http
DELETE /admin/comments/:id
```

**Headers:**
```http
Authorization: Bearer <admin_access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Comment deleted successfully",
  "data": {
    "deletedComment": {
      "id": 1,
      "author": "username",
      "ideaId": 1
    }
  }
}
```

### Get Content Stats
Get platform statistics.

```http
GET /admin/stats
```

**Headers:**
```http
Authorization: Bearer <admin_access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalIdeas": 150,
      "totalComments": 450,
      "totalVotes": 1200,
      "totalUsers": 75,
      "recentActivity": {
        "latestIdea": {
          // Latest idea object
        },
        "latestComment": {
          // Latest comment object
        },
        "topVotedIdea": {
          // Top voted idea object
        }
      }
    }
  }
}
```

## Configuration Endpoints

### Get Tags
Get available tags for ideas.

```http
GET /config/tags
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tags": [
      {
        "id": "technology",
        "name": "Technology",
        "color": "#3B82F6"
      },
      {
        "id": "innovation",
        "name": "Innovation",
        "color": "#10B981"
      }
    ]
  }
}
```

## Examples

### Complete User Flow Example

```javascript
// 1. Register a new user
const registerResponse = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'johndoe',
    email: 'john@example.com',
    password: 'SecurePassword123'
  })
});

const { data: { tokens } } = await registerResponse.json();

// 2. Create an idea
const ideaResponse = await fetch('/api/ideas', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${tokens.accessToken}`
  },
  body: JSON.stringify({
    title: 'My Great Idea',
    description: 'This is a detailed description of my idea...',
    tags: ['technology', 'innovation']
  })
});

const { data: { idea } } = await ideaResponse.json();

// 3. Vote on the idea
const voteResponse = await fetch(`/api/ideas/${idea.id}/vote`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${tokens.accessToken}`
  },
  body: JSON.stringify({
    voteType: 'upvote'
  })
});

// 4. Add a comment
const commentResponse = await fetch(`/api/comments/idea/${idea.id}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${tokens.accessToken}`
  },
  body: JSON.stringify({
    content: 'Great idea! I love this concept.'
  })
});
```

## SDK and Client Libraries

### JavaScript/TypeScript Client
```javascript
import { IdeasTrackerAPI } from 'ideas-tracker-client';

const api = new IdeasTrackerAPI({
  baseURL: 'http://localhost:3001/api',
  accessToken: 'your_access_token'
});

// Get ideas
const ideas = await api.ideas.getAll({
  page: 1,
  limit: 20,
  sortBy: 'votes',
  sortOrder: 'desc'
});

// Create idea
const newIdea = await api.ideas.create({
  title: 'My Idea',
  description: 'Description...',
  tags: ['technology']
});

// Vote on idea
await api.votes.cast(ideaId, 'upvote');
```

For more examples and advanced usage, see the [GitHub repository](https://github.com/your-username/ideas-tracker).