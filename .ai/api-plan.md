# REST API Plan - Flashcard Builder MVP

## 1. Resources

### Core Resources
| Resource | Database Table | Description |
|:---------|:--------------|:------------|
| **Flashcards** | `flashcards` | User-owned flashcard pairs (front/back) with source tracking |
| **Generations** | `generations` | AI generation sessions with metadata and statistics |
| **Generation Proposals** | N/A (temporary) | AI-generated flashcard proposals (not persisted until accepted) |
| **Learning Sessions** | N/A (client-side) | Spaced repetition algorithm state (managed by external library) |
| **Error Logs** | `generation_error_logs` | Audit logs for LLM API failures |

---

## 2. Endpoints

### 2.1 Authentication & User Management

#### POST /api/auth/register
**Description**: Register a new user and automatically log them in

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-v4",
      "email": "user@example.com",
      "created_at": "2026-01-11T12:00:00Z"
    },
    "session": {
      "access_token": "jwt-token",
      "refresh_token": "refresh-token",
      "expires_in": 3600
    }
  }
}
```

**Error Responses**:
- **400 Bad Request**: Invalid email format or weak password
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Password must contain uppercase, lowercase, numbers and special characters",
      "field": "password"
    }
  }
  ```
- **409 Conflict**: Email already registered
  ```json
  {
    "success": false,
    "error": {
      "code": "EMAIL_EXISTS",
      "message": "An account with this email already exists"
    }
  }
  ```

---

#### POST /api/auth/login
**Description**: Authenticate existing user

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-v4",
      "email": "user@example.com",
      "created_at": "2026-01-11T12:00:00Z"
    },
    "session": {
      "access_token": "jwt-token",
      "refresh_token": "refresh-token",
      "expires_in": 3600
    }
  }
}
```

**Error Responses**:
- **401 Unauthorized**: Invalid credentials
  ```json
  {
    "success": false,
    "error": {
      "code": "INVALID_CREDENTIALS",
      "message": "Invalid login credentials"
    }
  }
  ```

---

#### POST /api/auth/logout
**Description**: End user session
**Authentication**: Required

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

#### DELETE /api/auth/account
**Description**: Permanently delete user account and all associated data (GDPR compliance)
**Authentication**: Required

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Account and all associated data have been permanently deleted"
}
```

**Error Responses**:
- **401 Unauthorized**: Not authenticated

---

### 2.2 Flashcard Management

#### GET /api/flashcards
**Description**: Retrieve all flashcards for authenticated user
**Authentication**: Required

**Query Parameters**:
- `page` (integer, optional): Page number for pagination (default: 1)
- `limit` (integer, optional): Items per page (default: 50, max: 100)
- `source` (string, optional): Filter by source type (`ai-full`, `ai-edited`, `manual`)
- `sort` (string, optional): Sort field (`created_at`, `updated_at`) (default: `created_at`)
- `order` (string, optional): Sort order (`asc`, `desc`) (default: `desc`)

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "flashcards": [
      {
        "id": "uuid-v4",
        "front": "What is the capital of France?",
        "back": "Paris",
        "source": "manual",
        "generation_id": null,
        "created_at": "2026-01-11T12:00:00Z",
        "updated_at": "2026-01-11T12:00:00Z"
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 50,
      "total_pages": 3
    }
  }
}
```

**Error Responses**:
- **401 Unauthorized**: Not authenticated

---

#### GET /api/flashcards/:id
**Description**: Retrieve single flashcard by ID
**Authentication**: Required

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid-v4",
    "front": "What is the capital of France?",
    "back": "Paris",
    "source": "manual",
    "generation_id": null,
    "created_at": "2026-01-11T12:00:00Z",
    "updated_at": "2026-01-11T12:00:00Z"
  }
}
```

**Error Responses**:
- **401 Unauthorized**: Not authenticated
- **404 Not Found**: Flashcard doesn't exist or doesn't belong to user

---

#### POST /api/flashcards
**Description**: Create a new flashcard manually
**Authentication**: Required

**Request Body**:
```json
{
  "front": "What is TypeScript?",
  "back": "TypeScript is a strongly typed programming language that builds on JavaScript"
}
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "uuid-v4",
    "front": "What is TypeScript?",
    "back": "TypeScript is a strongly typed programming language that builds on JavaScript",
    "source": "manual",
    "generation_id": null,
    "created_at": "2026-01-11T12:00:00Z",
    "updated_at": "2026-01-11T12:00:00Z"
  },
  "message": "Flashcard created and added to learning schedule"
}
```

**Error Responses**:
- **400 Bad Request**: Validation error
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Front text exceeds maximum length of 200 characters",
      "field": "front"
    }
  }
  ```
- **401 Unauthorized**: Not authenticated

---

#### PUT /api/flashcards/:id
**Description**: Update existing flashcard
**Authentication**: Required

**Request Body**:
```json
{
  "front": "What is TypeScript?",
  "back": "TypeScript is a strongly typed superset of JavaScript that compiles to plain JavaScript"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid-v4",
    "front": "What is TypeScript?",
    "back": "TypeScript is a strongly typed superset of JavaScript that compiles to plain JavaScript",
    "source": "manual",
    "generation_id": null,
    "created_at": "2026-01-11T12:00:00Z",
    "updated_at": "2026-01-11T13:00:00Z"
  },
  "message": "Flashcard updated successfully"
}
```

**Error Responses**:
- **400 Bad Request**: Validation error
- **401 Unauthorized**: Not authenticated
- **404 Not Found**: Flashcard doesn't exist or doesn't belong to user

---

#### DELETE /api/flashcards/:id
**Description**: Delete a flashcard permanently
**Authentication**: Required

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Flashcard deleted successfully"
}
```

**Error Responses**:
- **401 Unauthorized**: Not authenticated
- **404 Not Found**: Flashcard doesn't exist or doesn't belong to user

---

### 2.3 AI Generation

#### POST /api/generations/generate
**Description**: Generate flashcard proposals from source text using LLM
**Authentication**: Required

**Request Body**:
```json
{
  "source_text": "String of 1000-10000 characters containing educational content to generate flashcards from"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "generation_id": "uuid-v4",
    "proposals": [
      {
        "proposal_id": "temp-uuid-1",
        "front": "What is the main concept?",
        "back": "The main concept is..."
      },
      {
        "proposal_id": "temp-uuid-2",
        "front": "How does X relate to Y?",
        "back": "X relates to Y by..."
      }
    ],
    "metadata": {
      "model_name": "anthropic/claude-3.5-sonnet",
      "source_text_length": 5432,
      "count_generated": 8
    }
  }
}
```

**Error Responses**:
- **400 Bad Request**: Invalid source text length
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Source text must be between 1000 and 10000 characters",
      "field": "source_text"
    }
  }
  ```
- **401 Unauthorized**: Not authenticated
- **409 Conflict**: Duplicate generation attempt
  ```json
  {
    "success": false,
    "error": {
      "code": "DUPLICATE_GENERATION",
      "message": "This text has already been processed. Please use a different text."
    }
  }
  ```
- **500 Internal Server Error**: LLM API failure
  ```json
  {
    "success": false,
    "error": {
      "code": "LLM_API_ERROR",
      "message": "Failed to generate flashcards. Please try again later.",
      "details": "API timeout after 30 seconds"
    }
  }
  ```
- **503 Service Unavailable**: LLM service unavailable

---

#### POST /api/generations/:generation_id/accept
**Description**: Accept an AI-generated flashcard proposal without modifications
**Authentication**: Required

**Request Body**:
```json
{
  "proposal_id": "temp-uuid-1",
  "front": "What is the main concept?",
  "back": "The main concept is..."
}
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "flashcard": {
      "id": "uuid-v4",
      "front": "What is the main concept?",
      "back": "The main concept is...",
      "source": "ai-full",
      "generation_id": "uuid-v4",
      "created_at": "2026-01-11T12:00:00Z",
      "updated_at": "2026-01-11T12:00:00Z"
    }
  },
  "message": "Flashcard accepted and added to learning schedule"
}
```

**Error Responses**:
- **400 Bad Request**: Invalid proposal data
- **401 Unauthorized**: Not authenticated
- **404 Not Found**: Generation session not found

---

#### POST /api/generations/:generation_id/accept-edited
**Description**: Accept an AI-generated flashcard proposal with user modifications
**Authentication**: Required

**Request Body**:
```json
{
  "proposal_id": "temp-uuid-1",
  "front": "What is the main concept? (edited)",
  "back": "The main concept is... (with user additions)"
}
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "flashcard": {
      "id": "uuid-v4",
      "front": "What is the main concept? (edited)",
      "back": "The main concept is... (with user additions)",
      "source": "ai-edited",
      "generation_id": "uuid-v4",
      "created_at": "2026-01-11T12:00:00Z",
      "updated_at": "2026-01-11T12:00:00Z"
    }
  },
  "message": "Edited flashcard accepted and added to learning schedule"
}
```

**Error Responses**:
- **400 Bad Request**: Validation error (exceeds character limits)
- **401 Unauthorized**: Not authenticated
- **404 Not Found**: Generation session not found

---

#### POST /api/generations/:generation_id/reject
**Description**: Reject an AI-generated flashcard proposal (action is permanent)
**Authentication**: Required

**Request Body**:
```json
{
  "proposal_id": "temp-uuid-1"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Proposal rejected"
}
```

**Error Responses**:
- **401 Unauthorized**: Not authenticated
- **404 Not Found**: Generation session not found

---

#### GET /api/generations/:generation_id
**Description**: Retrieve generation session details and statistics
**Authentication**: Required

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid-v4",
    "source_text_length": 5432,
    "model_name": "anthropic/claude-3.5-sonnet",
    "count_generated": 8,
    "count_accepted_unedited": 5,
    "count_accepted_edited": 2,
    "created_at": "2026-01-11T12:00:00Z",
    "updated_at": "2026-01-11T12:30:00Z"
  }
}
```

**Error Responses**:
- **401 Unauthorized**: Not authenticated
- **404 Not Found**: Generation not found or doesn't belong to user

---

### 2.4 Statistics & Analytics

#### GET /api/stats/overview
**Description**: Get user's overall statistics
**Authentication**: Required

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "total_flashcards": 245,
    "flashcards_by_source": {
      "ai-full": 150,
      "ai-edited": 45,
      "manual": 50
    },
    "ai_adoption_rate": 79.59,
    "total_generations": 15,
    "total_ai_proposals": 180,
    "ai_acceptance_rate": 86.11,
    "recent_activity": {
      "flashcards_created_last_7_days": 23,
      "generations_last_7_days": 3
    }
  }
}
```

**Error Responses**:
- **401 Unauthorized**: Not authenticated

---

#### GET /api/stats/generations
**Description**: Get detailed generation statistics
**Authentication**: Required

**Query Parameters**:
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 20, max: 50)

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "generations": [
      {
        "id": "uuid-v4",
        "model_name": "anthropic/claude-3.5-sonnet",
        "count_generated": 8,
        "count_accepted_unedited": 5,
        "count_accepted_edited": 2,
        "acceptance_rate": 87.5,
        "created_at": "2026-01-11T12:00:00Z"
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 20,
      "total_pages": 1
    }
  }
}
```

**Error Responses**:
- **401 Unauthorized**: Not authenticated

---

### 2.5 Learning Sessions

#### GET /api/learning/session
**Description**: Get flashcards scheduled for current learning session based on spaced repetition algorithm
**Authentication**: Required

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "session_id": "temp-session-uuid",
    "flashcards": [
      {
        "id": "uuid-v4",
        "front": "What is TypeScript?",
        "back": "TypeScript is a strongly typed programming language...",
        "scheduling_data": {
          "due_date": "2026-01-11T12:00:00Z",
          "stability": 5.2,
          "difficulty": 3.1,
          "elapsed_days": 2,
          "scheduled_days": 5,
          "reps": 3,
          "lapses": 0,
          "state": "Review",
          "last_review": "2026-01-06T12:00:00Z"
        }
      }
    ],
    "session_metadata": {
      "total_due": 12,
      "new_cards": 3,
      "review_cards": 9
    }
  }
}
```

**Error Responses**:
- **401 Unauthorized**: Not authenticated

---

#### POST /api/learning/review
**Description**: Record user's review rating for a flashcard during learning session
**Authentication**: Required

**Request Body**:
```json
{
  "flashcard_id": "uuid-v4",
  "rating": 3,
  "session_id": "temp-session-uuid"
}
```

**Notes**: 
- `rating` values follow FSRS algorithm: 1 = Again, 2 = Hard, 3 = Good, 4 = Easy
- Server updates scheduling data using external spaced repetition library

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "flashcard_id": "uuid-v4",
    "next_review_date": "2026-01-16T12:00:00Z",
    "updated_scheduling_data": {
      "stability": 8.7,
      "difficulty": 2.9,
      "elapsed_days": 5,
      "scheduled_days": 10,
      "reps": 4,
      "lapses": 0,
      "state": "Review",
      "last_review": "2026-01-11T12:00:00Z"
    }
  },
  "message": "Review recorded successfully"
}
```

**Error Responses**:
- **400 Bad Request**: Invalid rating value
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Rating must be between 1 and 4",
      "field": "rating"
    }
  }
  ```
- **401 Unauthorized**: Not authenticated
- **404 Not Found**: Flashcard not found

---

## 3. Authentication & Authorization

### Authentication Mechanism
**Supabase Auth with JWT Tokens**

- **Implementation**: Supabase handles authentication and issues JWT tokens
- **Token Type**: JWT access tokens with refresh token capability
- **Token Lifetime**: Access tokens expire in 1 hour, refresh tokens in 7 days
- **Token Transmission**: Bearer token in `Authorization` header
  ```
  Authorization: Bearer <jwt-token>
  ```

### Authorization Strategy
**Row Level Security (RLS)**

- All database operations are automatically filtered by `user_id` through Supabase RLS policies
- API endpoints verify authentication status before processing requests
- User can only access their own resources (flashcards, generations, stats)
- Account deletion cascades to all user-owned data (GDPR compliance)

### Endpoint Protection Levels

| Endpoint Pattern | Auth Required | Notes |
|:----------------|:--------------|:------|
| `/api/auth/register` | No | Public registration |
| `/api/auth/login` | No | Public login |
| `/api/auth/logout` | Yes | Authenticated users only |
| `/api/auth/account` | Yes | Account owner only |
| `/api/flashcards/*` | Yes | Owner access via RLS |
| `/api/generations/*` | Yes | Owner access via RLS |
| `/api/stats/*` | Yes | Owner stats only |
| `/api/learning/*` | Yes | Owner data only |

---

## 4. Validation & Business Logic

### 4.1 Input Validation Rules

#### Flashcard Validation
- **front**: Required, 1-200 characters, non-empty after trim
- **back**: Required, 1-500 characters, non-empty after trim
- **source**: Must be one of: `'ai-full'`, `'ai-edited'`, `'manual'`

#### Generation Source Text Validation
- **source_text**: Required, 1000-10000 characters
- **Validation**: Reject if identical hash exists for user (deduplication)
- **Sanitization**: Trim whitespace, remove control characters

#### Authentication Validation
- **email**: Valid email format (RFC 5322), max 255 characters
- **password**: Minimum 8 characters, must contain:
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one digit
  - At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)

#### Learning Session Validation
- **rating**: Integer between 1-4 (FSRS standard)
- **session_id**: Valid UUID format (client-generated for session tracking)

---

### 4.2 Business Logic Implementation

#### AI Generation Flow
1. **Validate** source text length and uniqueness
2. **Hash** source text using SHA-256
3. **Check** for duplicate hash in `generations` table for user
4. **Create** generation record with initial counts set to 0
5. **Call** LLM API via OpenRouter with system prompt for flashcard generation
6. **Parse** LLM response into structured proposals (front/back pairs)
7. **Return** proposals to client without persisting
8. **Log errors** to `generation_error_logs` if LLM call fails

#### Proposal Acceptance Flow (Unedited)
1. **Validate** proposal data matches expected format
2. **Create** flashcard with `source = 'ai-full'`
3. **Link** flashcard to `generation_id`
4. **Increment** `count_accepted_unedited` in generation record
5. **Initialize** scheduling data using FSRS algorithm (new card state)
6. **Return** created flashcard to client

#### Proposal Acceptance Flow (Edited)
1. **Validate** edited content against character limits
2. **Verify** content differs from original proposal
3. **Create** flashcard with `source = 'ai-edited'`
4. **Link** flashcard to `generation_id`
5. **Increment** `count_accepted_edited` in generation record
6. **Initialize** scheduling data using FSRS algorithm (new card state)
7. **Return** created flashcard to client

#### Proposal Rejection Flow
1. **Validate** proposal_id exists in client-side cache
2. **No database action** (rejected proposals are not stored per PRD)
3. **Return** success confirmation
4. **Note**: Generation statistics remain unchanged for rejections

#### Manual Flashcard Creation Flow
1. **Validate** front/back content
2. **Create** flashcard with `source = 'manual'` and `generation_id = null`
3. **Initialize** scheduling data using FSRS algorithm (new card state)
4. **Return** created flashcard to client

#### Learning Review Flow
1. **Validate** rating value (1-4)
2. **Fetch** current flashcard scheduling data
3. **Calculate** next review parameters using FSRS algorithm
4. **Update** scheduling metadata (stability, difficulty, interval, etc.)
5. **Record** review timestamp
6. **Return** updated scheduling information

#### Account Deletion Flow (GDPR)
1. **Verify** user authentication
2. **Trigger** CASCADE deletion via foreign key constraints:
   - Delete all `flashcards` (with scheduling data)
   - Delete all `generations`
   - Delete all `generation_error_logs`
3. **Delete** user record from `auth.users`
4. **Invalidate** all active sessions
5. **Return** confirmation

---

### 4.3 Error Handling Strategy

#### Client Errors (4xx)
- **400 Bad Request**: Validation errors, malformed JSON
  - Include specific field and constraint violated
  - Return user-friendly messages suitable for UI display
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Valid token but insufficient permissions
- **404 Not Found**: Resource doesn't exist or doesn't belong to user
- **409 Conflict**: Resource conflict (duplicate generation, email exists)
- **429 Too Many Requests**: Rate limit exceeded (future implementation)

#### Server Errors (5xx)
- **500 Internal Server Error**: Unexpected application errors
  - Log full error details server-side
  - Return generic message to client (don't leak internals)
- **502 Bad Gateway**: LLM API unreachable
- **503 Service Unavailable**: LLM service unavailable
- **504 Gateway Timeout**: LLM API timeout (>30s)

#### LLM-Specific Error Handling
All LLM errors are:
1. **Logged** to `generation_error_logs` table with:
   - Error code and message
   - Model name and source text metadata
   - Timestamp
2. **Returned** to client with user-friendly message
3. **Allow retry** - client can resubmit request
4. **Preserve** source text so user doesn't lose work

---

### 4.4 Performance Considerations

#### Pagination
- Default page size: 50 items for flashcards, 20 for generations
- Maximum page size: 100 items for flashcards, 50 for generations
- Use offset-based pagination for MVP simplicity
- Consider cursor-based pagination for future optimization

#### Database Optimization
- Leverage existing indexes on `user_id`, `generation_id`
- RLS policies automatically filter by `user_id` - no manual checks needed
- Use Supabase connection pooling for concurrent requests

#### Caching Strategy (Future)
- Client-side caching of flashcard list
- Cache learning session data locally
- Invalidate cache on CRUD operations

#### Rate Limiting (Future)
- LLM generation: 10 requests per hour per user
- Other endpoints: 100 requests per minute per user
- Implement using Supabase edge functions or middleware

---

### 4.5 Security Measures

#### Input Sanitization
- Trim all text inputs
- Remove potentially dangerous characters from text fields
- Validate all UUIDs match proper format
- Reject oversized payloads (max 1MB request body)

#### SQL Injection Prevention
- Use Supabase client with parameterized queries
- Never concatenate user input into SQL strings

#### XSS Prevention
- Sanitize flashcard content before rendering in UI
- Use React's built-in XSS protection
- Implement Content Security Policy (CSP) headers

#### CSRF Protection
- Supabase JWT tokens provide CSRF protection
- Use SameSite cookie attributes for session cookies
- Validate origin headers for sensitive operations

#### Data Privacy (GDPR/RODO)
- Account deletion removes all user data via CASCADE
- No data retention after account deletion
- RLS ensures users can't access others' data
- Hash source texts (SHA-256) for deduplication without storing originals

---

## 5. Response Format Standards

### Success Response Envelope
```json
{
  "success": true,
  "data": { /* resource data */ },
  "message": "Optional success message"
}
```

### Error Response Envelope
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "field": "fieldName (optional, for validation errors)",
    "details": "Additional context (optional)"
  }
}
```

### Pagination Envelope
```json
{
  "success": true,
  "data": {
    "items": [ /* array of resources */ ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 50,
      "total_pages": 3
    }
  }
}
```

---

## 6. API Versioning Strategy

**Current Version**: v1 (implicit in MVP)

- No version prefix in URLs for MVP (`/api/` not `/api/v1/`)
- Future breaking changes will introduce `/api/v2/` namespace
- Maintain backward compatibility within v1
- Deprecation notices in response headers for future changes

---

## 7. CORS Configuration

- **Allowed Origins**: Application domain only (configured in environment)
- **Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Allowed Headers**: Content-Type, Authorization
- **Credentials**: Include (for cookie-based session support)
- **Max Age**: 86400 seconds (24 hours for preflight caching)

---

## 8. Content Type & Encoding

- **Request Content-Type**: `application/json; charset=utf-8`
- **Response Content-Type**: `application/json; charset=utf-8`
- **Character Encoding**: UTF-8 throughout the application
- **Date Format**: ISO 8601 with timezone (`YYYY-MM-DDTHH:mm:ssZ`)

---

## 9. Implementation Notes

### Astro API Routes
- Implement endpoints as Astro API routes in `/src/pages/api/`
- File structure mirrors endpoint paths
- Use Astro's built-in request/response handling

### Supabase Integration
- Use `@supabase/supabase-js` client library
- Server-side client with service role for admin operations
- Client-side SDK for RLS-protected operations

### External Dependencies
- **FSRS Algorithm**: Use `ts-fsrs` or similar library for spaced repetition
- **OpenRouter Integration**: Use fetch API with proper error handling
- **Password Validation**: Use `zod` or similar for schema validation

### Environment Variables
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
```

---

## 10. Future Enhancements (Post-MVP)

- WebSocket support for real-time collaboration
- Batch operations for bulk flashcard import/export
- Advanced search and filtering capabilities
- Analytics dashboard with detailed charts
- A/B testing different LLM models per user preference
- Image support in flashcards
- Audio pronunciation support
- Mobile app with offline sync capabilities

