# Flutter Developer Prompt: Two-Step OTP Registration

The registration flow has been updated to a two-step process:

## Step 1 - Initiate Registration:

- **Endpoint**: `POST /auth/register/initiate`
- **Request body**:
  ```json
  {
    "phoneNumber": "+9647721270202",
    "firstName": "Ahmed",
    "lastName": "Hassan",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "phoneNumber": "+9647721270202",
    "provider": "namabar" | "dev",
    "verificationId": "...",  // optional
    "devCode": "123456"       // only in development mode
  }
  ```

## Step 2 - Verify OTP:

- **Endpoint**: `POST /auth/phone/verify`
- **Request body**:
  ```json
  {
    "phoneNumber": "+9647721270202",
    "code": "123456"
  }
  ```
- **Response**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

## Implementation Notes:

1. **First Screen**: Collect `firstName`, `lastName`, `phoneNumber`, and `password`
2. **When user submits**: Call `POST /auth/register/initiate`
3. **Navigate to OTP verification screen**
4. **On OTP screen**: Call `POST /auth/phone/verify` with the phone number and entered code
5. **On successful verification**: Store the `access_token` and navigate to the main app

## Error Handling:

- **409**: User already exists with verified phone (redirect to login)
- **400**: Invalid phone number or validation error
- **For OTP verification**: 400 means invalid or expired code

### Error Messages:

- If user already exists with a verified phone number, show: _"This phone number is already registered. Please login instead."_
- Allow users to retry OTP entry if code is invalid
- Consider adding a "Resend OTP" button that calls `POST /auth/register/initiate` again

## UI Flow:

1. **Registration Form Screen**:
   - First Name input field
   - Last Name input field
   - Phone Number input field (with international format validation)
   - Password input field (minimum 6 characters)
   - Submit button

2. **OTP Verification Screen**:
   - Display phone number (masked for privacy)
   - OTP input field (6 digits)
   - Verify button
   - Resend OTP button (optional)
   - Back to registration button (optional)

3. **Success Flow**:
   - Store JWT token securely
   - Navigate to main app/dashboard
   - Show welcome message with user's name

## Additional Considerations:

- **Loading states**: Show loading indicators during API calls
- **Form validation**: Validate phone number format, password strength
- **Network error handling**: Handle network failures gracefully
- **Token storage**: Use secure storage for JWT tokens
- **Auto-login**: Check for existing valid tokens on app startup
