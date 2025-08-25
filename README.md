# FitHub

<div>

A GitHub-inspired app that measures your fitness by tracking the number of steps you take each day

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

## Available Scripts

In the project directory, you can run:

### `npm start`
Runs the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `cd server npm start`
Starts the server on port 5001 by default.
✦ Health check: http://localhost:5001/api/health
✦ Auth endpoints: http://localhost:5001/api/auth
✦ Steps endpoint: http://localhost:5001/api/steps

### `npm test`
Launches the test runner in interactive watch mode.

### `npm run build`
Builds the app for production to the `build` folder.

## Structure
fithub/
```
fithub/
├── [Frontend (React App)]
│ ├── src/
│ │ ├── components/            
│ │ │ ├── Header.js            # Navigation header
│ │ │ ├── Profile.js           # Profile display
│ │ │ ├── ContributionGraph.js # Step visualization
│ │ │ ├── LogStepsForm.js      # Step logging form
│ │ │ └── ScreenshotUpload.js  # Image upload component
│ │ ├── pages/ 
│ │ │ ├── Dashboard.js         # Main dashboard
│ │ │ ├── ProfilePage.js       # User profile management
│ │ │ ├── Goals.js             # Goal setting and tracking
│ │ │ ├── Community.js         # Community features
│ │ │ ├── Terms.js             # Terms of service
│ │ │ └── PrivacyPolicy.js     # Privacy policy
│ │ ├── context/ 
│ │ │ └── AuthContext.js       # Authentication state
│ │ └── services/ 
│ │ ├── AuthService.js         # Authentication API calls
│ │ ├── StepService.js         # Step data API calls
│ │ └── ProfileService.js      # Profile management
│ └── public/ 


## Inspiration

Inspired by GitHub's contribution graph, FitHub brings the same satisfying visual progress tracking to your fitness journey. 

</div>