# Fix Google OAuth Origin Mismatch Error

## Problem
Error 400: origin_mismatch - The JavaScript origins in Google Cloud Console don't match your current frontend URL.

## Solution Steps

### 1. Open Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with the account that owns the OAuth credentials
3. Select your project (or create one if needed)

### 2. Navigate to OAuth Configuration
1. In the left sidebar, go to **APIs & Services** → **Credentials**
2. Find your OAuth 2.0 Client ID: `256651253074-ehbdlqvhi92hlimqsh5mpgj093gl87oi`
3. Click on the pencil/edit icon next to it

### 3. Update Authorized JavaScript Origins
In the **Authorized JavaScript origins** section, add these URLs:

```
http://localhost:4028
http://127.0.0.1:4028
https://localhost:4028
```

### 4. Update Authorized Redirect URIs (if needed)
In the **Authorized redirect URIs** section, add:

```
http://localhost:4028
http://localhost:4028/
```

### 5. Save Changes
Click **Save** at the bottom of the form.

## Important Notes

- Changes may take 5-15 minutes to propagate
- Clear your browser cache after making changes
- Make sure the frontend is running on port 4028
- The current Client ID is already configured in your .env file

## Testing
1. Restart your frontend server
2. Clear browser cache/cookies
3. Try Google OAuth login again

## Alternative: Create New OAuth Credentials
If you can't access the existing credentials, create new ones:
1. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
2. Choose **Web application**
3. Add the JavaScript origins listed above
4. Update your .env files with the new Client ID

## Current Configuration
- Frontend URL: http://localhost:4028
- Google Client ID: 256651253074-ehbdlqvhi92hlimqsh5mpgj093gl87oi.apps.googleusercontent.com