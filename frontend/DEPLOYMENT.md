# Deployment Guide for LMS Frontend

This guide provides step-by-step instructions for deploying the LMS frontend application to various hosting platforms.

## Prerequisites

- Node.js 14.x or higher
- npm 6.x or higher
- A GitHub account (for repository hosting)

## Preparing for Deployment

Before deploying, ensure you've made these final checks:

1. Verify that the backend URL is correctly set in the configuration:
   - `frontend/src/utils/apiUtils.js` has the correct `BACKEND_URL` value
   - `frontend/src/config/apiConfig.js` is using the production URL

2. Run a local production build to test:
   ```
   npm run build
   npm run preview
   ```

3. Commit all changes to your repository

## Deployment Options

### 1. Vercel (Recommended)

Vercel offers the easiest deployment experience for React applications.

1. Create an account at [vercel.com](https://vercel.com)

2. Install the Vercel CLI:
   ```
   npm install -g vercel
   ```

3. Navigate to the frontend directory and run:
   ```
   vercel login
   vercel
   ```

4. Follow the interactive prompts:
   - Link to your existing project (if any)
   - Specify the frontend directory as the project root
   - Confirm the build settings (build command should be `npm run build`)

5. To deploy to production:
   ```
   vercel --prod
   ```

Vercel will automatically detect React settings and deploy your application.

### 2. Netlify

1. Create an account at [netlify.com](https://netlify.com)

2. Use one of these options:
   
   **Option A: Netlify CLI**
   ```
   npm install -g netlify-cli
   netlify login
   netlify deploy
   ```
   
   **Option B: Drag and Drop**
   - Run `npm run build` locally
   - Go to netlify.com dashboard
   - Drag and drop the `dist` folder to the Netlify site

3. For production deployment via CLI:
   ```
   netlify deploy --prod
   ```

### 3. GitHub Pages

1. Modify your `vite.config.js` to add the base path:
   ```js
   export default defineConfig({
     base: '/LearningManagementSystem/', // Use your repository name
     // other config...
   });
   ```

2. Install gh-pages package:
   ```
   npm install --save-dev gh-pages
   ```

3. Add these scripts to package.json:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

4. Deploy:
   ```
   npm run deploy
   ```

5. Configure your GitHub repository to use GitHub Pages (Settings > Pages)

## Post-Deployment

After deployment, check that:

1. The application loads correctly
2. Login/registration functionality works
3. API connections are successful
4. Video playback functions properly

## Troubleshooting

If you encounter issues:

1. **CORS Errors**: Verify the API URL is using HTTPS and check the CORS headers in both frontend and backend.

2. **Authentication Issues**: Check the token handling in the browser's localStorage.

3. **Routing Errors**: Ensure your hosting platform is configured for SPA routing (see vercel.json and netlify.toml).

4. **Environment Variables**: Double-check that all environment variables are correctly set in the hosting platform. 