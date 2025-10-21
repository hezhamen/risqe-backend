# Two-Step OTP Registration Flow - Complete Example

This document provides a complete example of the two-step OTP registration flow using curl commands with actual responses.

## API Base URL

```
https://api.abqariya.com
```

## Step 1: Initiate Registration

### Request

```bash
curl -X POST https://api.abqariya.com/auth/register/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+9647721270202",
    "firstName": "Test",
    "lastName": "User",
    "password": "password123"
  }'
```

### Response

**Status Code:** `201 Created`

**Response Headers:**

```
HTTP/1.1 201 Created
Content-Type: application/json
Content-Length: 112
Date: Mon, 21 Oct 2025 15:07:22 GMT
```

**Response Body:**

```json
{
  "phoneNumber": "+9647721270202",
  "success": true,
  "provider": "namabar",
  "verificationId": "68f7a832724380cedf703e97"
}
```

### What Happens:

- ✅ User created in database (unverified status)
- ✅ Password hashed and stored securely
- ✅ OTP sent via Namabar SMS service
- ✅ User receives SMS with 6-digit code
- ✅ No JWT token returned yet (user not verified)

---

## Step 2: Verify OTP Code

### Request

```bash
curl -X POST https://api.abqariya.com/auth/phone/verify \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+9647721270202",
    "code": "895695"
  }'
```

### Response

**Status Code:** `200 OK`

**Response Headers:**

```
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 248
Date: Mon, 21 Oct 2025 15:08:32 GMT
```

**Response Body:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwaG9uZU51bWJlciI6Iis5NjQ3NzIxMjcwMjAyIiwic3ViIjoiY2UxN2FmOTgtODYyOC00NGY0LWFhYzYtZGM0MjExM2Q1Y2UxIiwiaWF0IjoxNzYxMDYwOTQ2LCJleHAiOjE3NjExNDczNDZ9._9s1CzxlnxIkKnrOf88Yi6e2uC9BdiftU8G1fbBpECU"
}
```

### What Happens:

- ✅ OTP code verified
- ✅ User marked as verified in database
- ✅ JWT access token generated
- ✅ User can now make authenticated API calls

---

## JWT Token Details

The returned JWT token contains:

```json
{
  "phoneNumber": "+9647721270202",
  "sub": "ce17af98-8628-44f4-aac6-dc42113d5ce1",
  "iat": 1761060946,
  "exp": 1761147346
}
```

- **User ID**: `ce17af98-8628-44f4-aac6-dc42113d5ce1`
- **Phone**: `+9647721270202`
- **Issued At**: Unix timestamp
- **Expires**: 24 hours from issue time

---

## Error Examples

### Invalid Phone Number Format

```bash
curl -X POST https://api.abqariya.com/auth/register/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "invalid-phone",
    "firstName": "Test",
    "lastName": "User",
    "password": "password123"
  }'
```

**Status Code:** `400 Bad Request`

**Response Headers:**

```
HTTP/1.1 400 Bad Request
Content-Type: application/json
Content-Length: 89
Date: Mon, 21 Oct 2025 15:10:00 GMT
```

**Response Body:**

```json
{
  "statusCode": 400,
  "message": ["phoneNumber must be a valid phone number"],
  "error": "Bad Request"
}
```

### User Already Exists (Verified)

```bash
curl -X POST https://api.abqariya.com/auth/register/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+9647721270202",
    "firstName": "Test",
    "lastName": "User",
    "password": "password123"
  }'
```

**Status Code:** `409 Conflict`

**Response Headers:**

```
HTTP/1.1 409 Conflict
Content-Type: application/json
Content-Length: 95
Date: Mon, 21 Oct 2025 15:11:00 GMT
```

**Response Body:**

```json
{
  "statusCode": 409,
  "message": "User already exists with this phone number",
  "error": "Conflict"
}
```

### Invalid OTP Code

```bash
curl -X POST https://api.abqariya.com/auth/phone/verify \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+9647721270202",
    "code": "000000"
  }'
```

**Status Code:** `400 Bad Request`

**Response Headers:**

```
HTTP/1.1 400 Bad Request
Content-Type: application/json
Content-Length: 78
Date: Mon, 21 Oct 2025 15:12:00 GMT
```

**Response Body:**

```json
{
  "statusCode": 400,
  "message": "Invalid or expired code",
  "error": "Bad Request"
}
```

### Expired OTP Code

```bash
curl -X POST https://api.abqariya.com/auth/phone/verify \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+9647721270202",
    "code": "895695"
  }'
```

**Status Code:** `400 Bad Request`

**Response Headers:**

```
HTTP/1.1 400 Bad Request
Content-Type: application/json
Content-Length: 78
Date: Mon, 21 Oct 2025 15:13:00 GMT
```

**Response Body:**

```json
{
  "statusCode": 400,
  "message": "Invalid or expired code",
  "error": "Bad Request"
}
```

---

## Using the Access Token

Once you have the access token, you can use it for authenticated requests:

```bash
curl -X GET https://api.abqariya.com/some-protected-endpoint \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Development Mode

In development mode, the OTP response includes a `devCode` field:

```json
{
  "phoneNumber": "+9647721270202",
  "success": true,
  "provider": "dev",
  "devCode": "123456"
}
```

This allows testing without actual SMS delivery.

---

## Complete Flow Summary

1. **POST /auth/register/initiate** → Creates unverified user + sends OTP
2. **User receives SMS** → 6-digit code via Namabar
3. **POST /auth/phone/verify** → Verifies OTP + returns JWT token
4. **User authenticated** → Can make protected API calls

The two-step flow ensures phone number verification before account activation, providing better security and user validation.

---

## Complete HTTP Status Codes Reference

### Success Responses

| Endpoint                  | Method | Status Code   | Description                         |
| ------------------------- | ------ | ------------- | ----------------------------------- |
| `/auth/register/initiate` | POST   | `201 Created` | User created successfully, OTP sent |
| `/auth/phone/verify`      | POST   | `200 OK`      | OTP verified, JWT token returned    |
| `/`                       | GET    | `200 OK`      | Health check endpoint               |

### Error Responses

| Status Code                 | Description             | Common Causes                                     |
| --------------------------- | ----------------------- | ------------------------------------------------- |
| `400 Bad Request`           | Invalid request data    | Invalid phone format, missing fields, invalid OTP |
| `401 Unauthorized`          | Authentication required | Missing or invalid JWT token                      |
| `403 Forbidden`             | Access denied           | Database wipe not allowed in production           |
| `404 Not Found`             | Resource not found      | Invalid endpoint URL                              |
| `409 Conflict`              | Resource already exists | User already registered with phone number         |
| `422 Unprocessable Entity`  | Validation failed       | Invalid data format or constraints                |
| `500 Internal Server Error` | Server error            | Database connection issues, SMS service failures  |

### Response Headers

All responses include standard headers:

```
Content-Type: application/json
Date: [Current timestamp]
Content-Length: [Response body size]
```

### Authentication Headers

For protected endpoints, include:

```
Authorization: Bearer [JWT_TOKEN]
```

### Rate Limiting

The API may implement rate limiting for OTP requests:

- **OTP Requests**: Limited to prevent spam
- **Verification Attempts**: Limited to prevent brute force
- **General API**: Standard rate limits apply

### Timeouts

- **OTP Expiry**: 5 minutes from generation
- **JWT Token**: 24 hours from issue
- **Request Timeout**: 30 seconds for most endpoints
