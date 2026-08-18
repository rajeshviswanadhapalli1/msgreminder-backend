# Message Reminder Backend

Express 5 + MySQL API for the Message Reminder mobile app.

## Features

- Email/password registration and login (JWT)
- SMTP password reset flow
- User profile management
- Reminder CRUD with upcoming / all / completed views
- Repeat and priority support
- OpenAPI docs at `/api/docs`
- Frontend integration guide in [docs/frontend-integration.md](docs/frontend-integration.md)

## Prerequisites

- Node.js 18+
- MySQL 8+

## Setup

1. **Clone and install**

```bash
npm install
```

2. **Create MySQL database**

```sql
CREATE DATABASE msgreminder CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

For tests:

```sql
CREATE DATABASE msgreminder_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. **Configure environment**

```bash
cp .env.example .env
```

Edit `.env` with your MySQL credentials, JWT secret, and SMTP settings.

4. **Run migrations**

```bash
npm run migrate
```

5. **Start the server**

```bash
npm run dev
```

Server: `http://localhost:3000`  
API base: `http://localhost:3000/api/v1`  
Swagger UI: `http://localhost:3000/api/docs`

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register` | No | Create account |
| POST | `/api/v1/auth/login` | No | Login |
| POST | `/api/v1/auth/forgot-password` | No | Send reset email |
| POST | `/api/v1/auth/reset-password` | No | Reset password |
| GET | `/api/v1/users/me` | Yes | Get profile |
| PATCH | `/api/v1/users/me` | Yes | Update profile |
| PATCH | `/api/v1/users/me/password` | Yes | Change password |
| GET | `/api/v1/reminders` | Yes | List reminders |
| POST | `/api/v1/reminders` | Yes | Create reminder |
| GET | `/api/v1/reminders/:id` | Yes | Get reminder |
| PATCH | `/api/v1/reminders/:id` | Yes | Update reminder |
| DELETE | `/api/v1/reminders/:id` | Yes | Delete reminder |
| POST | `/api/v1/reminders/:id/complete` | Yes | Complete reminder |

## SMTP (password reset)

Configure in `.env`:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Message Reminder <noreply@example.com>"
PASSWORD_RESET_URL=myapp://reset-password
```

In development without SMTP, reset tokens are printed to the server console.

## Tests

```bash
NODE_ENV=test npm test
```

Ensure `msgreminder_test` database exists and migrations have been run for the test environment.

## Project structure

```
src/
  app.js              Express app
  server.js           Server bootstrap
  config/             Env + Sequelize
  models/             Sequelize models
  migrations/         DB migrations
  routes/             API routes
  controllers/        Request handlers
  services/           Business logic
  validators/         express-validator rules
  middleware/         Auth, errors, validation
  docs/openapi.yaml   OpenAPI spec
docs/
  frontend-integration.md
```

## License

Private — Message Reminder project
