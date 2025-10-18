# CI/CD Setup for Risqe Backend

This repository includes automated CI/CD pipeline that deploys to Heroku when you push to the main branch.

## Setup Instructions

### 1. Get Heroku API Key

1. Go to [Heroku Account Settings](https://dashboard.heroku.com/account)
2. Scroll down to "API Key" section
3. Click "Reveal" to show your API key
4. Copy the API key

### 2. Add GitHub Secrets

1. Go to your GitHub repository
2. Click on "Settings" tab
3. In the left sidebar, click "Secrets and variables" → "Actions"
4. Click "New repository secret"
5. Add the following secret:
   - **Name**: `HEROKU_API_KEY`
   - **Value**: Your Heroku API key from step 1

### 3. Verify Heroku App Name

Make sure the Heroku app name in the workflow matches your actual app:

- Current app name in workflow: `risqe-backend`
- If different, update the `HEROKU_APP_NAME` environment variable in `.github/workflows/deploy.yml`

## How It Works

### On Pull Request

- Runs tests, linting, and build
- Does NOT deploy to Heroku

### On Push to Main/Master

1. **Test Phase**:
   - Installs dependencies
   - Runs linter
   - Runs tests
   - Builds the application
   - Uploads build artifacts

2. **Deploy Phase** (only if tests pass):
   - Downloads build artifacts
   - Deploys to Heroku
   - Waits for deployment to complete
   - Performs health check
   - Tests OTP endpoint
   - Shows deployment success message

## Workflow Features

- ✅ **Automated Testing**: Runs on every push and PR
- ✅ **Build Verification**: Ensures code compiles before deployment
- ✅ **Health Checks**: Verifies deployment success
- ✅ **Endpoint Testing**: Tests critical API endpoints
- ✅ **Artifact Management**: Efficient build artifact handling
- ✅ **Error Handling**: Comprehensive error reporting
- ✅ **Notifications**: Clear success/failure messages

## Manual Deployment

If you need to deploy manually:

```bash
git push heroku main
```

## Troubleshooting

### Common Issues

1. **"HEROKU_API_KEY not found"**
   - Make sure you've added the secret in GitHub repository settings

2. **"App not found"**
   - Verify the Heroku app name in the workflow file
   - Make sure the app exists in your Heroku account

3. **"Health check failed"**
   - Check Heroku logs: `heroku logs --tail --app risqe-backend`
   - Verify the app is running correctly

4. **"Tests failing"**
   - Fix any linting or test issues locally first
   - Run `npm run lint` and `npm test` locally

### Viewing Workflow Runs

1. Go to your GitHub repository
2. Click on "Actions" tab
3. Click on any workflow run to see detailed logs

## Environment Variables

The following environment variables are automatically set by Heroku:

- `NODE_ENV=production`
- `DATABASE_URL` (PostgreSQL connection string)
- `JWT_SECRET` (if configured)

Make sure these are properly configured in your Heroku app settings.
