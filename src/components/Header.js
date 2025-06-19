import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();

  return (
    <header className="bg-[#161b22] border-b border-[#30363d] py-4">
      <div className="max-w-7xl mx-auto px-5">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-[#f0f6fc] no-underline">FitHub</Link>
          <nav className="flex gap-6">
            <Link 
              to="/" 
              className={`text-[#c9d1d9] no-underline font-medium px-4 py-2 rounded-md transition-colors duration-200
                ${location.pathname === '/' ? 'bg-[#21262d] text-[#f0f6fc]' : 'hover:bg-[#21262d] hover:text-[#f0f6fc]'}`}
            >
              Dashboard
            </Link>
            <Link 
              to="/workouts" 
              className={`text-[#c9d1d9] no-underline font-medium px-4 py-2 rounded-md transition-colors duration-200
                ${location.pathname === '/workouts' ? 'bg-[#21262d] text-[#f0f6fc]' : 'hover:bg-[#21262d] hover:text-[#f0f6fc]'}`}
            >
              Workouts
            </Link>
            <Link 
              to="/progress" 
              className={`text-[#c9d1d9] no-underline font-medium px-4 py-2 rounded-md transition-colors duration-200
                ${location.pathname === '/progress' ? 'bg-[#21262d] text-[#f0f6fc]' : 'hover:bg-[#21262d] hover:text-[#f0f6fc]'}`}
            >
              Progress
            </Link>
            <Link 
              to="/community" 
              className={`text-[#c9d1d9] no-underline font-medium px-4 py-2 rounded-md transition-colors duration-200
                ${location.pathname === '/community' ? 'bg-[#21262d] text-[#f0f6fc]' : 'hover:bg-[#21262d] hover:text-[#f0f6fc]'}`}
            >
              Community
            </Link>
            <Link 
              to="/profile" 
              className={`text-[#c9d1d9] no-underline font-medium px-4 py-2 rounded-md transition-colors duration-200
                ${location.pathname === '/profile' ? 'bg-[#21262d] text-[#f0f6fc]' : 'hover:bg-[#21262d] hover:text-[#f0f6fc]'}`}
            >
              Profile
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header; 