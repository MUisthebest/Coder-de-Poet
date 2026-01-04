# Swagger API Documentation Guide

This document provides information on accessing the OpenAPI/Swagger documentation for all microservices in the Coder-de-Poet platform.

## Overview

All services in this project have comprehensive Swagger/OpenAPI documentation integrated. You can access interactive API documentation through their respective Swagger UI endpoints.

---

## Services and Documentation URLs

### 1. **Course Service** (NestJS)
- **Port:** 3001 (default)
- **Swagger UI:** `{baseUrl}/api/docs`
- **OpenAPI JSON:** `{baseUrl}/api/docs/swagger-json`
- **Redoc:** Available through Swagger UI

#### Documented Endpoints:
- **Courses** - Create, read, update, delete courses; publish/unpublish
- **Categories** - Manage course categories
- **Lessons** - Manage course lessons with quiz generation
- **Quizzes** - Create and manage quizzes with submissions
- **Enrollments** - User course enrollment management
- **Reviews** - Course review management
- **Admin** - Admin dashboard and user management
- **Search** - Course search and filtering

---

### 2. **Auth Service** (.NET Core)
- **Port:** 5001 (default)
- **Swagger UI:** `{baseUrl}/swagger/index.html`
- **OpenAPI JSON:** `{baseUrl}/swagger/v1/swagger.json`

#### Documented Endpoints:
- **Authentication** - Sign up, sign in, logout, token refresh
- **User Management** - Get user info, update profile
- **Social Login** - Google, Facebook authentication
- **Password Recovery** - Forgot password, reset password
- **Admin Functions** - User management, role assignment, account enable/disable
- **Instructor Info** - Get instructor details

#### Security:
- Bearer Token authentication
- JWT-based authorization
- Role-based access control (Admin, Instructor, Student)

---

### 3. **AI Service** (FastAPI)
- **Port:** 8000 (default)
- **Swagger UI:** `{baseUrl}/api/docs`
- **ReDoc:** `{baseUrl}/api/redoc`
- **OpenAPI JSON:** `{baseUrl}/api/openapi.json`

#### Documented Endpoints:
- **Health Check** - Service health status
- **Kafka Consumer** - Background task for processing YouTube transcripts and generating quizzes

#### Responsibilities:
- Process YouTube video transcripts
- Generate quiz questions using AI
- Message queue-based architecture with Kafka

---

### 4. **Chat Service** (FastAPI)
- **Port:** 8001 (default)
- **Swagger UI:** `{baseUrl}/api/docs`
- **ReDoc:** `{baseUrl}/api/redoc`
- **OpenAPI JSON:** `{baseUrl}/api/openapi.json`

#### Documented Endpoints:
- **Root** - Service information
- **Health Check** - Database connectivity verification
- **Chat Operations** - Send messages, get messages, manage sessions
- **Session Management** - Create, list, delete chat sessions
- **History** - Retrieve complete chat history

#### Features:
- Real-time chat with AI responses
- Message persistence
- Session-based conversations
- Chat history tracking

---

### 5. **IDE Service** (.NET Core)
- **Port:** 5002 (default)
- **Swagger UI:** `{baseUrl}/api/docs`
- **OpenAPI JSON:** `{baseUrl}/swagger/v1/swagger.json`

#### Documented Endpoints:
- **Problems** - Get all problems, get problem details with templates
- **Code Execution** - Run code against test cases with batch processing

#### Supported Languages:
- C++
- Java
- Python

#### Features:
- Multi-language code execution
- Automated test case evaluation
- Docker-based sandboxed execution
- Performance metrics (time, memory)

---

## How to Access Documentation

### Using Docker Compose
```bash
# Start all services
docker-compose up

# Services will be available at:
# - Course Service: http://localhost:3001/api/docs
# - Auth Service: http://localhost:5015/swagger/index.html
# - AI Service: http://localhost:8000/api/docs
# - Chat Service: http://localhost:8001/api/docs
# - IDE Service: http://localhost:5002/api/docs
```

### Direct Access
1. Open your browser
2. Navigate to the Swagger UI URL for the desired service
3. Explore endpoints interactively
4. Try out requests directly from the UI

---

## Authentication

### Bearer Token (JWT)
For services requiring authentication:

1. **Sign in** using `/api/auth/signin` (Auth Service)
2. **Copy the access token** from the response
3. **Click "Authorize"** button in Swagger UI
4. **Enter:** `Bearer <your_access_token>`

### Available in:
- Course Service (for protected endpoints)
- Chat Service (most endpoints)
- IDE Service (if integrated)

---

## Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 500 | Server Error - Internal server error |
| 503 | Service Unavailable - Database/dependency issue |

---

## API Response Format

### Success Response:
```json
{
  "status": 200,
  "data": { /* resource data */ },
  "message": "Operation successful"
}
```

### Error Response:
```json
{
  "status": 400,
  "error": "Invalid request",
  "details": "Field validation failed"
}
```

---

## Development Notes

### Setting Up Locally

#### Course Service (NestJS):
```bash
cd course_service
npm install
npm run start:dev
```

#### Auth Service (.NET):
```bash
cd auth_service
dotnet restore
dotnet run
```

#### AI Service (FastAPI):
```bash
cd AI_service
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

#### Chat Service (FastAPI):
```bash
cd chat_service
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8001
```

#### IDE Service (.NET):
```bash
cd ide_service
dotnet restore
dotnet run
```

---

## Troubleshooting

### Service Documentation Not Loading:
1. Ensure service is running on correct port
2. Check firewall/network settings
3. Clear browser cache
4. Try accessing from incognito/private window

### Authentication Errors:
1. Verify token is still valid (not expired)
2. Check token format (should be: `Bearer token_string`)
3. Verify user has required permissions/roles

### Database Connection Issues:
1. Check database is running
2. Verify connection strings in environment variables
3. Check database credentials and permissions

---

## Additional Resources

- **OpenAPI Specification:** https://spec.openapis.org/oas/v3.0.0
- **Swagger/OpenAPI Tools:** https://swagger.io/tools/
- **FastAPI Documentation:** https://fastapi.tiangolo.com/
- **NestJS Documentation:** https://docs.nestjs.com/
- **.NET Core Documentation:** https://docs.microsoft.com/en-us/dotnet/

---

## Support

For issues or questions regarding API documentation:
1. Check the respective service's Swagger documentation
2. Review error messages and HTTP status codes
3. Check service logs for detailed error information
4. Refer to the service's README in its directory

---

**Last Updated:** January 2026
**API Version:** 1.0.0
