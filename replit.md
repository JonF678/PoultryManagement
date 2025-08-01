# Poultry Management System

## Overview
This Progressive Web Application (PWA) is designed for comprehensive poultry farm management. It offers offline-capable functionality for tracking production cycles, managing cages, logging vital production data, and analyzing performance metrics. The system is a client-side application utilizing local data storage, ensuring reliability even without internet connectivity. Its core capabilities include detailed tracking of egg and bird sales, expenses, and vaccination records, providing a holistic view of farm operations and profitability.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Single Page Application (SPA)**: Built with vanilla JavaScript and a custom routing system.
- **Progressive Web App (PWA)**: Includes a service worker for offline functionality and an app-like experience, enabling installation as a native app.
- **Responsive Design**: Utilizes Bootstrap 5 for a mobile-first, responsive UI.
- **Component-Based**: Modular JavaScript components organize different sections like cycles, cages, and analytics.

### Data Storage
- **IndexedDB**: Browser-based NoSQL database for robust offline data persistence.
- **Local Storage**: All data is stored client-side for complete offline functionality, with no server dependencies.

### UI/UX Decisions
- **Bootstrap 5**: Core framework for responsive grid systems and UI components.
- **Font Awesome**: Used for consistent iconography.
- **Chart.js**: Integrated for dynamic data visualization and analytics charts.
- **Custom CSS**: Augments styling using CSS custom properties for a tailored look.
- **Date Format**: Universal `dd/mm/yyyy` format implemented across the entire application for consistent date display.
- **Currency Support**: User-selectable currency (Ghanaian Cedi, US Dollar, British Pound) with Ghanaian Cedi as default, applied consistently across all financial records.

### Technical Implementations
- **Core Components**: Includes CycleOverview (main dashboard), CageDetail (individual cage management), Analytics (performance metrics), and CageManager (creation/management).
- **Calculations**: Provides utilities for feed conversion ratios, laying percentages, efficiency metrics, and comprehensive financial calculations (e.g., ROI).
- **Data Flow**: User input is immediately saved to IndexedDB, triggering real-time UI updates, on-demand analytics processing, and Chart.js rendering.
- **Daily Entry System**: Redesigned for cage-level entry of mortality and egg production, with cycle-level tracking for feed consumption and birds sold. Auto-calculates flock age and opening birds.
- **Sales and Expense Management**: Dual-tab system for tracking egg and bird sales, and categorized expense recording. Features comprehensive filtering by category and sales type.
- **Vaccination Management**: Comprehensive tracking with user-configurable schedules and automatic flock age calculation.
- **CSV Import/Export**: Bidirectional data transfer for production logs, sales, expenses, and feed logs, optimized for Excel compatibility with template downloads and smart import that auto-creates missing cycles/cages.
- **Analytics Enhancements**: Time period filtering (daily, weekly, monthly, yearly), daily metric granularity, and secondary Y-axes for percentage-based metrics in charts. Handles various data field formats for compatibility.

## External Dependencies

### CDN Resources
- **Bootstrap 5.3.0**: CSS framework and JavaScript components for responsive design.
- **Font Awesome 6.4.0**: Icon library for visual elements.
- **Chart.js 3.9.1**: JavaScript library for data visualization and analytics charts.

### PWA Features
- **Service Worker**: Manages caching of application resources for offline functionality.
- **Web App Manifest**: Enables the application to be installed as a native app on devices.