# FitHub

<div>

A GitHub-inspired app that measures your fitness by tracking the number of steps you take each day

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)


</div>
## Features

✦ **GitHub-Style Interface** - Familiar dark theme and layout inspired by GitHub  

✦ **Contribution Squares** - Visual representation of your year-long fitness journey  

✦ **Real-time Stats** - Track total workouts, current streak, and fitness score

✦ **Responsive Design** - Clean, modern UI that works on all devices


## Getting Started

### Prerequisites

✦ Node.js (version 16 or higher)  

✦ npm (comes with Node.js)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd fithub
```

2. Install dependencies:
```bash
npm install
```

3. Run the backend server:
```bash
cd server
npm start
```

4. Start the development server:
```bash
cd fithub
npm start
```

5. Open your browser and navigate to:
```
http://localhost:3000
```

## Current Issues
Data loss on server restart - all data is in-memory
No user persistence - users disappear after restart
No step data persistence - all step data lost on restart

These wil be addressed once we add express-session

## Usage

### Tracking Workouts
✦ **Click on any square** to cycle through workout intensities:
  ✦ **Gray**: No workout
  ✦ **Light Green**: Light workout
  ✦ **Medium Green**: Moderate workout
  ✦ **Dark Green**: Good workout
  ✦ **Bright Green**: Intense workout

### Viewing Stats
✦ **Total Workouts**: See your cumulative workout count
✦ **Current Streak**: Track consecutive workout days
✦ **Fitness Score**: Overall fitness rating
✦ **Activity Graph**: Year-long visual representation

## Available Scripts

In the project directory, you can run:

### `npm start`
Runs the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm test`
Launches the test runner in interactive watch mode.

### `npm run build`
Builds the app for production to the `build` folder.

## Structure
fithub/
```
├── **[Project Configuration]**
│   ├── package.json              # Frontend dependencies & scripts
│   ├── package-lock.json         # Frontend dependency lock file
│   ├── tailwind.config.js        # Tailwind CSS configuration
│   ├── postcss.config.js         # PostCSS configuration
│   ├── README.md                 # Project documentation
│   └── .gitignore                # Git ignore rules
│
├── **[Frontend (React App)]**
│   ├── public/                  # Static files served by React
│   │   ├── index.html           # Main HTML template
│   │   ├── manifest.json        # PWA manifest
│   │   └── assets/
│   │       └── thumbnail.png    # App thumbnail/logo
│   │
│   └── src/                     # React source code
│       ├── index.js             # React app entry point
│       ├── App.js               # Main app component & routing
│       ├── index.css            # Global styles & Tailwind imports
│       │
│       ├── components/          # Reusable UI components
│       │   ├── Header.js        # Navigation header
│       │   ├── Profile.js       # Profile display component
│       │   └── ContributionGraph.js # Step data visualization
│       │
│       ├── pages/               # Full page components
│       │   ├── Dashboard.js     # Main dashboard (step tracking)
│       │   ├── ProfilePage.js   # User profile management
│       │   ├── Progress.js      # Progress tracking page
│       │   ├── Community.js     # Community features page
│       │   ├── Workouts.js      # Workouts page (legacy/future)
│       │   ├── Terms.js         # Terms of service
│       │   └── PrivacyPolicy.js # Privacy policy
│       │
│       ├── context/              # React Context for state management
│       │   └── ProfileContext.js # User profile state
│       │
│       └── services/             # Frontend API services
│           ├── stepService.js    # Step data API calls
│
├── Backend API (Node.js/Express)
│   └── server/
│       ├── index.js            # Main server entry point
│       ├── package.json        # Backend dependencies & scripts
│       ├── package-lock.json   # Backend dependency lock file
│       │
│       ├── routes/             # API route definitions
│       │   └── stepRoutes.js   # Step tracking endpoints
│       │
│       ├── services/           # Business logic layer
│       │   └── stepService.js  # Step data management service
│       │
│       ├── controllers/        # Request handlers (empty, ready for use)
│       ├── models/             # Data models (empty, ready for database)
│       ├── config/             # Configuration files
│       └── node_modules/       # Backend dependencies
│
├── Development Tools
│   └── scripts/
│       └── generate-cert.js    # SSL certificate generation for HTTPS
│
└── Generated/System Files
    ├── node_modules/           # Frontend dependencies
    └── .git/                   # Git version control
```

## Inspiration

Inspired by GitHub's contribution graph, FitHub brings the same satisfying visual progress tracking to your fitness journey. 

