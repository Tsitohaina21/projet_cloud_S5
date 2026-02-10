# Road Works Monitor - Web Application

A React-based web application for managing and monitoring road works in Antananarivo, Madagascar.

## Features

### For Visitors
- View interactive map of road works locations
- See detailed information about each road work
  - Status (Nouveau/En Cours/Terminé)
  - Surface area (m²)
  - Budget
  - Company name
  - Photos
- View overall statistics
  - Total number of signalements
  - Total surface area
  - Progress percentage
  - Total budget

### For Managers
- All visitor features plus:
- **Dashboard** - Manage all road works
  - View and update signalment status
  - Synchronize data with Firebase
  - Real-time map updates
- **User Management**
  - Create new user accounts
  - View all users
  - Unlock blocked accounts
  - Manage user credentials
- **Statistics**
  - Processing time analytics
  - Status distribution charts
  - Completion rate tracking
  - Signalement status breakdown

## Technology Stack

- **Frontend Framework**: React 19.2
- **Routing**: React Router v7
- **State Management**: Zustand
- **Maps**: Leaflet + React-Leaflet
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Build Tool**: Vite
- **Language**: TypeScript

## Installation

### Prerequisites
- Node.js 16+ and npm
- Identity Provider API running on `http://localhost:8000`

### Setup

1. **Install dependencies:**
   `bash
   npm install
   `

2. **Configure environment variables:**
   `bash
   cp .env.example .env
   `
   
   Edit `.env` with your API URL:
   `
   VITE_API_URL=http://localhost:8000/api
   `

3. **Start development server:**
   `bash
   npm run dev
   `
   
   The app will be available at `http://localhost:5174`

## Project Structure

`
src/
 components/          # Reusable React components
    Header.tsx       # Navigation header
    Map.tsx          # Leaflet map component
    SignalementList.tsx  # List/detail of signalements
    SummaryCard.tsx  # Statistics summary cards
 pages/               # Page components
    HomePage.tsx     # Main dashboard
    LoginPage.tsx    # User login
    RegisterPage.tsx # User registration
    DashboardPage.tsx    # Manager dashboard
    ManageUsersPage.tsx  # User management
    StatisticsPage.tsx   # Analytics page
 services/            # API services
    authService.ts   # Authentication API
    signalementService.ts  # Signalements API
    userService.ts   # User management API
 stores/              # State management
    authStore.ts     # Zustand auth store
 types/               # TypeScript type definitions
    index.ts
 utils/               # Utility functions
 App.tsx              # Main app component
 App.css              # Global styles
 main.tsx             # Application entry point
 index.css            # Tailwind directives
`

## Available Scripts

- **npm run dev** - Start development server
- **npm run build** - Build for production
- **npm run preview** - Preview production build
- **npm run lint** - Run ESLint

## User Roles

### Visitor
- Read-only access
- View map and statistics
- No login required

### Manager
- Can manage all features
- Create and manage users
- Synchronize data
- View analytics

## License

Confidential - Not for Public Consumption or Distribution

## Contributors

Groupe de 4 - Promotion 17
