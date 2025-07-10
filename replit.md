# Poultry Management System

## Overview

This is a comprehensive Progressive Web Application (PWA) for managing poultry farms. The system provides offline-capable functionality for tracking production cycles, managing cages, logging production data, and analyzing performance metrics. Built as a client-side application with local data storage, it's designed to work reliably even without internet connectivity.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Single Page Application (SPA)**: Built with vanilla JavaScript using a custom routing system
- **Progressive Web App (PWA)**: Includes service worker for offline functionality and app-like experience
- **Responsive Design**: Bootstrap 5 for mobile-first responsive UI
- **Component-Based**: Modular JavaScript components for different sections (cycles, cages, analytics)

### Data Storage
- **IndexedDB**: Browser-based NoSQL database for offline data persistence
- **Local Storage**: All data stored client-side for complete offline functionality
- **No Backend**: Pure client-side application with no server dependencies

### UI Framework
- **Bootstrap 5**: For responsive grid system and UI components
- **Font Awesome**: For icons and visual elements
- **Chart.js**: For data visualization and analytics charts
- **Custom CSS**: Additional styling using CSS custom properties

## Key Components

### Database Schema (IndexedDB)
- **Cycles**: Production cycles with start/end dates, status, and metadata
- **Cages**: Individual cage management with cycle association
- **Production Logs**: Daily egg collection and production tracking
- **Feed Logs**: Feed consumption and cost tracking

### Component Architecture
- **CycleOverview**: Main dashboard for managing production cycles
- **CageDetail**: Individual cage management and production logging
- **Analytics**: Performance metrics and data visualization
- **CageManager**: Cage creation and management interface

### Utilities
- **Calculations**: Feed conversion ratios, laying percentages, efficiency metrics
- **Charts**: Chart.js wrapper for consistent data visualization
- **Router**: Client-side routing for navigation

## Data Flow

1. **User Input**: Forms capture production data (eggs, feed, mortality)
2. **Local Storage**: Data immediately saved to IndexedDB
3. **Real-time Updates**: UI updates reflect changes instantly
4. **Analytics Processing**: Calculations performed on-demand for metrics
5. **Chart Rendering**: Visual data representation using Chart.js

## External Dependencies

### CDN Resources
- **Bootstrap 5.3.0**: CSS framework and JavaScript components
- **Font Awesome 6.4.0**: Icon library
- **Chart.js 3.9.1**: Data visualization library

### PWA Features
- **Service Worker**: Caches resources for offline functionality
- **Web App Manifest**: Enables installation as native app
- **Responsive Icons**: App icons for various device sizes

## Deployment Strategy

### Static Hosting
- **Client-Side Only**: Can be deployed to any static hosting service
- **No Server Requirements**: Complete frontend application
- **CDN Dependencies**: Relies on external CDNs for libraries

### Offline Capability
- **Service Worker Caching**: Caches all application resources
- **Local Data Storage**: All user data stored in browser
- **Network-Independent**: Full functionality without internet connection

### Installation
- **PWA Installation**: Users can install as native app
- **Cross-Platform**: Works on desktop and mobile browsers
- **No App Store**: Direct installation from browser

## Technical Considerations

### Performance
- **Lazy Loading**: Components loaded on-demand
- **Efficient Queries**: IndexedDB queries optimized for performance
- **Minimal Dependencies**: Lightweight external library usage

### Data Management
- **No Synchronization**: Pure offline approach
- **Export Capabilities**: Data can be exported for backup
- **Browser Storage Limits**: Subject to browser storage quotas

### Browser Compatibility
- **Modern Browsers**: Requires support for IndexedDB, Service Workers
- **ES6+ Features**: Uses modern JavaScript features
- **Progressive Enhancement**: Graceful degradation for older browsers

## Recent Changes

### July 10, 2025 - Enhanced Daily Entry System
- **Updated Daily Entry Form**: Modified cage detail component to capture specific data points:
  - Date, flock age (days), opening birds, cage, mortality, birds sold
  - Eggs produced in trays (1 tray = 30 eggs), current feed in kg
- **Automated Calculations**: System now calculates:
  - Age in days & weeks, closing balance of birds
  - Cumulative mortality till date and percentage
  - Production percentage (current), cumulative production (trays)
  - Hen house production (eggs per bird from 19th week laying period)
  - Feed metrics: current/cumulative feed per bird (kg), current/cumulative feed per egg (grams)

### July 10, 2025 - Added Sales, Expense, and Vaccination Tracking
- **Sales Management**: Track egg sales per crate with customer details, payment methods
- **Expense Management**: Record expenses per cycle by category (feed, medication, labor, etc.)
- **Vaccination Records**: Comprehensive vaccination tracking with recommended schedules
- **Database Schema**: Updated to version 2 with new object stores for sales, expenses, vaccinations
- **Navigation**: Enhanced analytics dashboard with quick access to all tracking features

## Recent Changes: Latest modifications with dates

### July 10, 2025 - Enhanced Daily Entry System
- **Updated Daily Entry Form**: Modified cage detail component to capture specific data points:
  - Date, flock age (days), opening birds, cage, mortality, birds sold
  - Eggs produced in trays (1 tray = 30 eggs), current feed in kg
- **Automated Calculations**: System now calculates:
  - Age in days & weeks, closing balance of birds
  - Cumulative mortality till date and percentage
  - Production percentage (current), cumulative production (trays)
  - Hen house production (eggs per bird from 19th week laying period)
  - Feed metrics: current/cumulative feed per bird (kg), current/cumulative feed per egg (grams)

### July 10, 2025 - Added Sales, Expense, and Vaccination Tracking
- **Sales Management**: Track egg sales per crate with customer details, payment methods
- **Expense Management**: Record expenses per cycle by category (feed, medication, labor, etc.)
- **Vaccination Records**: Comprehensive vaccination tracking with recommended schedules
- **Database Schema**: Updated to version 2 with new object stores for sales, expenses, vaccinations
- **Navigation**: Enhanced analytics dashboard with quick access to all tracking features