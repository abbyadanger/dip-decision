# GitHub Pages Deployment Setup

This repository has been configured for automatic deployment to GitHub Pages using GitHub Actions.

## What was configured:

### 1. Next.js Configuration (`next.config.js`)
- Configured for static export with `output: 'export'`
- Set up proper base path for GitHub Pages (`/dip-decision`)
- Optimized for static hosting

### 2. Package.json Scripts
- Added `export` and `deploy` scripts for building static assets

### 3. GitHub Actions Workflow (`.github/workflows/deploy.yml`)
- Automatically builds and deploys your site when you push to the main branch
- Uses Node.js 18 and handles all dependencies
- Deploys to GitHub Pages with proper permissions

### 4. Static Assets
- Added `.nojekyll` file to prevent Jekyll processing
- Created `public/` directory with robots.txt

## To activate GitHub Pages:

1. Push these changes to your GitHub repository
2. Go to your repository settings on GitHub
3. Navigate to "Pages" in the sidebar
4. Set Source to "GitHub Actions"
5. Your site will be available at: `https://[your-username].github.io/dip-decision/`

## Local Development:
- Use `npm run dev` for local development
- Use `npm run build` to test the production build locally

The site will automatically rebuild and deploy whenever you push changes to the main branch.