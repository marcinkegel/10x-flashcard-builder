# REST API Plan - Flashcard Builder MVP

## 1. Resources

### Core Resources

| Resource                 | Database Table          | Description                                                     |
| :----------------------- | :---------------------- | :-------------------------------------------------------------- |
| **Flashcards**           | `flashcards`            | User-owned flashcard pairs (front/back) with source tracking    |
| **Generations**          | `generations`           | AI generation sessions with metadata and statistics             |
| **Generation Proposals** | N/A (temporary)         | AI-generated flashcard proposals (not persisted until accepted) |
| **Error Logs**           | `generation_error_logs` | Audit logs for LLM API failures                                 |

---

## 2. Endpoints

### 2.1 Flashcard Management

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

**Description**: Create one or more flashcards in a single request.
**Authentication**: Required

**Notes**:

- This endpoint supports both manual and AI-generated flashcard creation (`source`: `'manual'`, `'ai-full'`, or `'ai-edited'`).
- If `generation_id` is provided, the server **automatically increments** the corresponding `generations` table counters (`count_accepted_unedited` or `count_accepted_edited`) in the same transaction.
- Returns all created flashcards and reports granular validation errors per item.

**Request Body**:
Either a single object or an array of objects. Each object requires at least `front`, `back`, and `source` fields.

```json
{
  "front": "What is TypeScript?",
  "back": "TypeScript is a strongly typed programming language that builds on JavaScript",
  "source": "manual"
}
```

or for batch/AI usage:

```json
[
  {
    "front": "What is an interface in TypeScript?",
    "back": "An interface defines the shape of an object.",
    "source": "ai-full",
    "generation_id": "uuid-gen-1"
  },
  {
    "front": "Why use TypeScript?",
    "back": "It offers static typing for easier maintenance.",
    "source": "ai-edited",
    "generation_id": "uuid-gen-1"
  }
]
```

**Success Response** (201 Created):
Returns an array of all successfully created flashcards.

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-v4-1",
      "front": "What is an interface in TypeScript?",
      "back": "An interface defines the shape of an object.",
      "source": "ai-full",
      "generation_id": "uuid-gen-1",
      "created_at": "2026-01-11T12:00:00Z",
      "updated_at": "2026-01-11T12:00:00Z"
    },
    {
      "id": "uuid-v4-2",
      "front": "What is TypeScript?",
      "back": "TypeScript is a strongly typed programming language that builds on JavaScript",
      "source": "manual",
      "generation_id": null,
      "created_at": "2026-01-11T12:00:00Z",
      "updated_at": "2026-01-11T12:00:00Z"
    }
  ],
  "message": "Flashcard(s) created and added to learning schedule"
}
```

**Error Responses**:

- **400 Bad Request**: One or more items failed validation. Valid items will not be partially created; the request is transactional.
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Some flashcards failed validation",
      "details": [
        {
          "index": 1,
          "field": "front",
          "message": "Front text exceeds maximum length of 200 characters"
        },
        {
          "index": 2,
          "field": "source",
          "message": "Source must be 'manual', 'ai-full', or 'ai-edited'"
        }
      ]
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

### 2.2 AI Generation

#### POST /api/generations/

**Description**: Generate flashcard proposals from source text using LLM. Returns proposals that client can then save using `POST /api/flashcards`.
**Authentication**: Required

**Business Logic**:

1. Server creates a `generations` record.
2. Server calls LLM API (OpenRouter).
3. On success, `count_generated` is set in the DB and proposals are returned to the client.
4. **On failure**, the server logs the error to `generation_error_logs` before returning a 5xx response.

**Request Body**:

```json
{
  "source_text": "String of 1000-10000 characters containing content to generate flashcards from"
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

**Usage Flow**:

1. Client calls this endpoint to generate proposals
2. Proposals are displayed to user (client-side state)
3. User can accept/edit/reject proposals (client-side)
4. Accepted proposals are saved via `POST /api/flashcards` with appropriate `source` and `generation_id`
5. Rejected proposals are simply discarded (no API call needed)

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
    "model_name": "GPT-4o mini",
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

#### GET /api/generations

**Description**: Retrieve all generation sessions and statistics for the authenticated user
**Authentication**: Required

**Query Parameters**:
support paggination as needed

**Success Response** (200 OK):

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-v4",
      "source_text_length": 5432,
      "model_name": "anthropic/claude-3.5-sonnet",
      "count_generated": 8,
      "count_accepted_unedited": 5,
      "count_accepted_edited": 2,
      "created_at": "2026-01-11T12:00:00Z",
      "updated_at": "2026-01-11T12:30:00Z"
    }
    // ...additional generations
  ]
}
```

**Error Responses**:

- **401 Unauthorized**: Not authenticated

---

### 2.3 Generation Error Logging

**Note**: LLM errors are logged automatically by the server during `POST /api/generations/`.

#### GET /api/generation-errors

**Description**: Retrieve generation error logs for the authenticated user
**Authentication**: Required

**Query Parameters**:

- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 50)
- `error_code` (string, optional): Filter by specific error code

**Success Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "uuid-v4",
        "source_text_hash": "sha256...",
        "source_text_length": 5432,
        "model_name": "gemini-3-flash",
        "error_code": "LLM_PARSE_ERROR",
        "error_message": "Unexpected JSON format",
        "created_at": "2026-01-11T12:00:00Z"
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 50,
      "total_pages": 1
    }
  }
}

**Error Responses**:
- **401 Unauthorized**: Not authenticated
- **403 : Forbidden if acces is restricted to admin users
```

---

## 3. Authentication & Authorization

### Authentication Mechanism

**Supabase Auth **

- **Implementation**: Supabase handles authentication

### Authorization Strategy

**Row Level Security (RLS)**

- All database operations are automatically filtered by `user_id` through Supabase RLS policies
- API endpoints verify authentication status before processing requests
- User can only access their own resources (flashcards, generations, generation_errors)
- Account deletion cascades to all user-owned data (GDPR compliance)

### Endpoint Protection Levels

| Endpoint Pattern         | Auth Required | Notes                    |
| :----------------------- | :------------ | :----------------------- |
| `/api/auth/register`     | No            | Public registration      |
| `/api/auth/login`        | No            | Public login             |
| `/api/auth/logout`       | Yes           | Authenticated users only |
| `/api/auth/account`      | Yes           | Account owner only       |
| `/api/flashcards/*`      | Yes           | Owner access via RLS     |
| `/api/generations/*`     | Yes           | Owner access via RLS     |
| `/api/generation-errors` | Yes           | Owner access via RLS     |

---

## 4. Validation & Business Logic

### 4.1 Input Validation Rules

#### Flashcard Validation

- **front**: Required, 1-200 characters, non-empty after trim
- **back**: Required, 1-500 characters, non-empty after trim
- **source**: Must be one of: `'ai-full'`, `'ai-edited'`, `'manual'`
  - On creation (POST): Any of the three values allowed.
  - On update (PUT):
    - If original source was `'ai-full'`, can only stay `'ai-full'` (if content unchanged) or change to `'ai-edited'` (if content changed).
    - If original source was `'ai-edited'`, must stay `'ai-edited'`.
    - If original source was `'manual'`, must stay `'manual'`.
    - Transition to/from `'manual'` is forbidden.
- **generation_id**:
  - Required if `source` is `'ai-full'` or `'ai-edited'`, must be a valid UUID.
  - Must be `null` for `source = 'manual'`.
  - Immutable after creation (cannot be changed in PUT).

#### Generation Source Text Validation

- **source_text**: Required, 1000-10000 characters
- **Validation**: Reject if identical hash exists for user (deduplication)
- **Sanitization**: Trim whitespace, remove control characters

---

### 4.2 Business Logic Implementation

#### AI Generation Flow

1. **Validate** source text length (1000-10000 characters)
2. **Hash** source text using SHA-256

3. **Check** for existing successful generation for user + hash (deduplication)
4. **Create** generation record with initial counts set to 0
5. **Call** LLM API via OpenRouter with system prompt for flashcard generation
6. **On LLM success**:
   - Update `count_generated` in the `generations` record
   - Parse LLM response into structured proposals (front/back pairs)
   - Return proposals to client without persisting them individually
7. **On LLM error**:
   - Log error to `generation_error_logs`
   - Return error response to client with user-friendly message
   - Preserve source text so user doesn't lose work

**Client-side workflow after generation**:

- Display proposals to user
- User can accept (as-is or edited) or reject each proposal
- Selected proposals → saved via `POST /api/flashcards` with `source: 'ai-full'` or `'ai-edited'` and `generation_id`
- When flashcards are created with a `generation_id`, the `POST /api/flashcards` endpoint automatically updates the generation statistics (`count_accepted_unedited` or `count_accepted_edited`)
- Rejected proposals → simply discarded (no API call)

#### Manual Flashcard Creation Flow

1. **Validate** front/back content
2. **Create** flashcard with `source = 'manual'` and `generation_id = null`
3. **Initialize** scheduling data using FSRS algorithm (new card state)
4. **Return** created flashcard to client

#### AI Flashcard Acceptance Flow (via POST /api/flashcards)

1. **Validate** proposal data (front/back content, source type)
2. **Verify** generation_id exists if source is AI-related
3. **Create** flashcard with appropriate source (`'ai-full'` or `'ai-edited'`)
4. **Link** flashcard to `generation_id`
5. **Increment** appropriate counter in generation record **atomically**:
   - `count_accepted_unedited` if `source = 'ai-full'`
   - `count_accepted_edited` if `source = 'ai-edited'`
6. **Return** created flashcard to client

**Note**: The `POST /api/flashcards` endpoint handles both manual and AI-generated flashcard creation in a unified way, with automatic statistics tracking for AI generations.

#### Flashcard Update Flow (via PUT /api/flashcards/:id)

1. **Validate** front/back content and source transition rules.
2. **If** source changes from `'ai-full'` to `'ai-edited'` and `generation_id` is present:
   - Decrement `count_accepted_unedited` in the linked `generations` record.
   - Increment `count_accepted_edited` in the linked `generations` record.
   - _Note_: This operation should be atomic (transactional).
3. **Update** the flashcard record.
4. **Return** updated flashcard.

#### Account Deletion Flow (GDPR)

1. **Verify** user authentication
2. **Trigger** CASCADE deletion via foreign key constraints:
   - Delete all `flashcards` (with scheduling data)
   - Delete all `generations`
   - Delete all `generation_error_logs`
3. **Delete** user record from `auth.users` (auth table handled by SUPABASE)
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

1. **Logged** automatically server side to `generation_error_logs` with:
   - SHA-256 hash of source text (for correlation, not storage)
   - Source text length
   - Model name
   - Error code (e.g., `API_TIMEOUT`, `LLM_PARSE_ERROR`, `RATE_LIMIT_EXCEEDED`)
   - Full error message
   - Timestamp (automatic)
2. **Returned** to client with user-friendly message and error details
3. **Allow retry** - client can resubmit request
4. **Preserve** source text so user doesn't lose work

**Common Error Codes**:

- `API_TIMEOUT`: LLM API request exceeded timeout limit (>30s)
- `API_UNAVAILABLE`: LLM service is down or unreachable
- `RATE_LIMIT_EXCEEDED`: Too many requests to LLM API
- `LLM_PARSE_ERROR`: Unable to parse LLM response into flashcard format
- `INVALID_RESPONSE`: LLM returned unexpected or malformed data
- `INSUFFICIENT_CREDITS`: OpenRouter account has insufficient credits

---
