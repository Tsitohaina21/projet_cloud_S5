# Web App Setup & Deployment Guide

## Quick Start

### Prerequisites
- Node.js 16+ and npm installed
- Identity Provider running on `http://localhost:8000`
- Web app directory structure set up

### Local Development Setup

#### Windows (PowerShell)
```powershell
cd web-app
.\start.ps1
```

#### Unix/Linux/macOS
```bash
cd web-app
chmod +x start.sh
./start.sh
```

#### Manual Setup
```bash
cd web-app
npm install
npm run dev
```

The application will start on `http://localhost:5174`

## Environment Configuration

### Create .env file
```bash
cp .env.example .env
```

### Configure API endpoint in .env
```
VITE_API_URL=http://localhost:8000/api
```

For production, update this to your production API URL.

## Running the Application

### Development Server
```bash
npm run dev
```
- Hot Module Replacement (HMR) enabled
- Auto-reload on file changes
- Port: 5174 (or next available)

### Production Build
```bash
npm run build
```

This creates optimized files in the `dist` directory.

### Preview Production Build
```bash
npm run preview
```

## Architecture Overview

### Frontend Stack
- **React 19.2** - UI Library
- **Vite 7.3** - Build tool and dev server
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Router v7** - Client-side routing
- **Zustand** - State management
- **Axios** - HTTP client
- **Leaflet** - Map visualization

### Application Structure

#### Pages
- **HomePage** - Public visitor view with map
- **LoginPage** - User authentication
- **RegisterPage** - New account creation
- **DashboardPage** - Manager control center
- **ManageUsersPage** - User administration
- **StatisticsPage** - Analytics and reporting

#### Components
- **Header** - Navigation and user info
- **Map** - Interactive Leaflet map
- **SummaryCard** - Statistics display
- **SignalementList** - List and detail view

#### Services
- **authService** - Authentication API calls
- **signalementService** - Signalements CRUD
- **userService** - User management

#### Stores
- **authStore** - Zustand for auth state

## Features Implementation

### Visitor Features
1. Map View
   - Leaflet-based interactive map
   - Color-coded markers (Red/Orange/Green)
   - Popup information on hover
   - Click to select details

2. Statistics Dashboard
   - Total signalements count
   - Total surface area (m²)
   - Progress percentage
   - Total budget display

3. Signalement Details
   - Title and description
   - Status with progress bar
   - Surface, budget, company
   - Photo gallery

### Manager Features

1. Dashboard
   - All visitor features
   - Sync button for Firebase
   - Update signalement status
   - Real-time map updates

2. User Management
   - Create new user accounts
   - View all users
   - Unlock blocked accounts
   - View user details

3. Statistics
   - Processing time analysis
   - Status distribution chart
   - Completion rate
   - Average processing times

## API Integration

### Authentication Endpoints
```
POST   /auth/login              - Login user
POST   /auth/register           - Create account
PUT    /auth/users/:id          - Update profile
GET    /auth/users              - List all users (manager)
GET    /auth/users/blocked      - List blocked users (manager)
POST   /auth/users/:id/unlock   - Unlock user (manager)
POST   /auth/users              - Create user (manager)
```

### Signalements Endpoints
```
GET    /signalements            - Get all signalements
GET    /signalements/my         - Get user's signalements
POST   /signalements            - Create signalement
PUT    /signalements/:id        - Update signalement
GET    /signalements/statistics - Get statistics
POST   /signalements/:id/photos - Upload photos
POST   /sync                    - Sync with Firebase
```

## Authentication Flow

1. User logs in with email/password
2. API returns user object + JWT token
3. Token stored in localStorage
4. Token included in all subsequent requests
5. On page refresh, app restores auth state from localStorage

## State Management (Zustand)

### AuthStore
```typescript
{
  user: User | null           // Current user
  token: string | null        // JWT token
  isLoading: boolean          // Loading state
  error: string | null        // Error message
  login()                     // Login action
  register()                  // Register action
  logout()                    // Logout action
  updateUser()                // Update user state
  clearError()                // Clear error
  loadFromStorage()           // Restore from localStorage
}
```

## Styling with Tailwind CSS

The application uses utility-first CSS with Tailwind:
- Responsive design (mobile-first)
- Dark mode support ready (not enabled by default)
- Custom colors via theme extension
- Gradient backgrounds
- Transition animations

## Deployment

### Build for Production
```bash
npm run build
npm run preview  # Test the build
```

### Deploy to Static Hosting
The `dist` folder contains production-ready files.

#### Option 1: Direct Web Server
Copy `dist` contents to web server root:
```bash
cp -r dist/* /var/www/html/road-works
```

#### Option 2: Docker Container
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["npx", "serve", "-s", "dist", "-l", "3000"]
```

#### Option 3: Cloud Platform
- **Vercel**: `vercel deploy`
- **Netlify**: `netlify deploy`
- **AWS S3 + CloudFront**: `aws s3 sync dist/ s3://bucket-name/`

### Environment Variables for Production
Update `.env.production`:
```
VITE_API_URL=https://api.example.com/api
```

## Testing & Debugging

### Browser DevTools
- Open DevTools (F12)
- Check Console for logs
- Network tab for API calls
- Application tab for localStorage

### Common Issues

#### "API not reachable"
- Check VITE_API_URL in .env
- Ensure Identity Provider is running
- Check CORS configuration on backend

#### "Map not showing"
- Verify Leaflet CSS imported
- Check browser console for errors
- Ensure map container has dimensions

#### "Authentication issues"
- Clear localStorage and cookies
- Check JWT token validity
- Verify backend auth endpoints

## Performance Optimization

### Production Build Techniques
- Code splitting by route
- Tree-shaking for unused code
- CSS purging with Tailwind
- Asset compression
- lazy loading images

### Lighthouse Metrics
- Aim for 90+ Performance
- Aim for 95+ Accessibility
- Aim for 95+ Best Practices
- Aim for 95+ SEO

## Git Workflow

### Recommended Structure
```
main branch          - Production releases
├── develop branch   - Development base
    ├── feature/...  - Feature branches
    ├── bugfix/...   - Bug fix branches
    └── release/...  - Release preparation
```

### Commit Convention
```
feat: Add new feature
fix: Fix bug
docs: Documentation update
style: Code style changes
refactor: Code refactoring
```

## Maintenance & Updates

### Dependency Updates
```bash
npm outdated              # Check for updates
npm update               # Update dependencies
npm audit                # Check security issues
npm audit fix            # Fix vulnerabilities
```

### React Version Updates
Check React documentation for breaking changes.

### Tailwind Updates
```bash
npm install -D tailwindcss@latest
```

## Support & Documentation

- React Docs: https://react.dev
- Vite Docs: https://vitejs.dev
- Tailwind Docs: https://tailwindcss.com
- Leaflet Docs: https://leafletjs.com
- Zustand Docs: https://github.com/pmndrs/zustand

## License

Confidential - Not for Public Consumption or Distribution

---

**Last Updated**: February 2026
**Version**: 1.0
