# Frontend Integration Guide — Message Reminder API

This guide maps the mobile UI screens to backend endpoints and explains how the frontend should integrate authentication, reminders, and local notifications.

## Base URL

```
Development: http://localhost:3000/api/v1
Production:  https://your-api-domain.com/api/v1
```

Interactive API docs: `GET /api/docs` (Swagger UI)

Health check: `GET /health`

---

## Authentication flow

### 1. Sign Up screen

**Endpoint:** `POST /auth/register`

```json
{
  "fullName": "Rajesh Kumar",
  "email": "rajesh@example.com",
  "country": "India",
  "countryCode": "+91",
  "mobile": "9876543210",
  "password": "SecurePass123",
  "timezone": "Asia/Kolkata"
}
```

**Response (201):**

```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "fullName": "Rajesh Kumar",
      "email": "rajesh@example.com",
      "country": "India",
      "countryCode": "+91",
      "mobile": "9876543210",
      "timezone": "Asia/Kolkata",
      "createdAt": "2026-01-01T10:00:00.000Z",
      "updatedAt": "2026-01-01T10:00:00.000Z"
    }
  }
}
```

Store `token` securely (Keychain/Keystore/SecureStore). Navigate to Home.

### 2. Login screen

**Endpoint:** `POST /auth/login`

```json
{
  "email": "rajesh@example.com",
  "password": "SecurePass123"
}
```

Response shape is the same as register.

### 3. Forgot Password screen

**Endpoint:** `POST /auth/forgot-password`

```json
{ "email": "rajesh@example.com" }
```

Always show the same success message regardless of whether the email exists:

> If an account exists for that email, a reset link has been sent.

In development without SMTP, the reset token is logged on the server console.

### 4. Reset Password screen

The email/deep link should open the app with `?token=...`.

**Endpoint:** `POST /auth/reset-password`

```json
{
  "token": "paste-token-from-email",
  "newPassword": "NewSecurePass123"
}
```

Returns a new auth token. Old tokens are invalidated.

---

## Authorized requests

Add this header to every protected request:

```
Authorization: Bearer <token>
Content-Type: application/json
```

If you receive `401 UNAUTHORIZED`, clear stored credentials and redirect to Login.

---

## Profile / Settings screen

### Get profile

**Endpoint:** `GET /users/me`

### Update profile

**Endpoint:** `PATCH /users/me`

```json
{
  "fullName": "Rajesh K",
  "timezone": "Asia/Kolkata"
}
```

### Change password (Settings)

**Endpoint:** `PATCH /users/me/password`

```json
{
  "currentPassword": "SecurePass123",
  "newPassword": "AnotherSecurePass456"
}
```

After password change, replace stored token or force re-login.

---

## Reminders — Home tabs

| UI Tab      | API Query              |
|-------------|------------------------|
| Upcoming    | `GET /reminders?view=upcoming` |
| All         | `GET /reminders?view=all`      |
| Completed   | `GET /reminders?view=completed`|

**Example:**

```
GET /reminders?view=upcoming&page=1&limit=20
Authorization: Bearer <token>
```

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Mom's Birthday",
      "message": "Wish mom happy birthday",
      "category": "birthday",
      "scheduledAt": "2026-05-15T05:00:00.000Z",
      "timezone": "Asia/Kolkata",
      "repeat": "yearly",
      "priority": "high",
      "status": "pending",
      "completedAt": null,
      "seriesId": "uuid",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

### Grouping by Today / Tomorrow

The API returns UTC ISO timestamps plus each reminder's `timezone`. Convert on the client:

```javascript
// Example (JavaScript)
const local = new Date(reminder.scheduledAt);
// Group by local calendar day for "Today", "Tomorrow", etc.
```

Use the user's profile timezone (`user.timezone`) as default when creating reminders.

---

## Add / Edit Reminder screen

### Create

**Endpoint:** `POST /reminders`

```json
{
  "title": "Mom's Birthday",
  "message": "Wish mom happy birthday",
  "category": "birthday",
  "scheduledAt": "2026-05-15T05:00:00.000Z",
  "timezone": "Asia/Kolkata",
  "repeat": "yearly",
  "priority": "high"
}
```

| Field        | Values |
|--------------|--------|
| `message`    | Required, max 500 chars |
| `scheduledAt`| Required ISO-8601 UTC datetime |
| `repeat`     | `none`, `daily`, `weekly`, `monthly`, `yearly` |
| `priority`   | `low`, `medium`, `high` |
| `category`   | `general`, `birthday`, `meeting`, `anniversary`, `other` |

### Update

**Endpoint:** `PATCH /reminders/:id`

Send only fields that changed. After update, **reschedule the local notification**.

### Details screen

**Endpoint:** `GET /reminders/:id`

### Delete

**Endpoint:** `DELETE /reminders/:id`

Cancel the associated local notification after delete.

### Complete

**Endpoint:** `POST /reminders/:id/complete`

**Non-repeating response:**

```json
{
  "data": {
    "completed": { "...reminder with status completed..." },
    "next": null
  }
}
```

**Repeating response:**

```json
{
  "data": {
    "completed": { "...completed occurrence..." },
    "next": { "...new pending occurrence..." }
  }
}
```

Cancel notification for `completed.id`. Schedule a new local notification for `next` when present.

---

## Local notification integration (mobile responsibility)

The backend **does not send push notifications**. The mobile app should:

1. **After login / app launch:** fetch upcoming reminders and schedule local notifications.
2. **After create/update:** schedule or reschedule notification using `reminder.id` as the notification identifier.
3. **After delete:** cancel notification for that `reminder.id`.
4. **After complete:**
   - Cancel notification for completed reminder.
   - If `next` is returned, schedule notification for the next occurrence.

Suggested notification payload:

```javascript
{
  id: reminder.id,           // use as notification ID
  title: reminder.title || 'Reminder',
  body: reminder.message,
  triggerAt: reminder.scheduledAt
}
```

---

## Error handling

All errors follow:

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Validation failed",
    "details": [
      { "field": "message", "message": "Message must be at most 500 characters" }
    ]
  }
}
```

Common codes:

| HTTP | code            | When |
|------|-----------------|------|
| 400  | BAD_REQUEST     | Validation failed |
| 401  | UNAUTHORIZED    | Missing/invalid token |
| 404  | NOT_FOUND       | Reminder not found or not owned |
| 409  | CONFLICT        | Email/mobile already registered |

Show `error.message` in the UI. Use `error.details` for field-level form errors.

---

## Screen-to-endpoint map

| Screen              | Endpoint(s) |
|---------------------|-------------|
| Splash / Onboarding | No API (client-only) |
| Login               | `POST /auth/login` |
| Sign Up             | `POST /auth/register` |
| Forgot Password     | `POST /auth/forgot-password` |
| Reset Password      | `POST /auth/reset-password` |
| Home — Upcoming     | `GET /reminders?view=upcoming` |
| Home — All          | `GET /reminders?view=all` |
| Home — Completed    | `GET /reminders?view=completed` |
| Add Reminder        | `POST /reminders` |
| Edit Reminder       | `PATCH /reminders/:id` |
| Reminder Details    | `GET /reminders/:id`, `POST /reminders/:id/complete`, `DELETE /reminders/:id` |
| Settings / Profile  | `GET /users/me`, `PATCH /users/me`, `PATCH /users/me/password` |

---

## Quick React Native / fetch example

```javascript
const API_BASE = 'http://localhost:3000/api/v1';

async function api(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();
  if (!res.ok) throw json.error;
  return json;
}

// Login
const { data } = await api('/auth/login', {
  method: 'POST',
  body: { email, password },
});
const token = data.token;

// List upcoming reminders
const reminders = await api('/reminders?view=upcoming', { token });
```
