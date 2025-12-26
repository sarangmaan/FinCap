import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "w-10 h-10" }) => {
  return (
    <svg 
      viewBox="0 0 100 60" 
      className={className} 
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Fin Cap Logo"
    >
      <defs>
        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" /> {/* Emerald-500 */}
          <stop offset="50%" stopColor="#f59e0b" /> {/* Amber-500 */}
          <stop offset="100%" stopColor="#f43f5e" /> {/* Rose-500 */}
        </linearGradient>
      </defs>
      
      {/* Gauge Background Track */}
      <path 
        d="M 10 50 A 40 40 0 0 1 90 50" 
        fill="none" 
        stroke="#1e293b" 
        strokeWidth="12" 
        strokeLinecap="round" 
      />

      {/* Gauge Colored Arc with Dashed effect to look like segments */}
      <path 
        d="M 10 50 A 40 40 0 0 1 90 50" 
        fill="none" 
        stroke="url(#gaugeGradient)" 
        strokeWidth="12" 
        strokeLinecap="round"
        strokeDasharray="2 4"
      />
      
      {/* Needle Shadow */}
      <path 
        d="M 50 50 L 75 25" 
        stroke="#0f172a" 
        strokeWidth="6" 
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* Needle (Pointing to 'high' risk/right side) */}
      <line 
        x1="50" y1="50" 
        x2="72" y2="22" 
        stroke="white" 
        strokeWidth="4" 
        strokeLinecap="round" 
      />
      
      {/* Pivot Point */}
      <circle cx="50" cy="50" r="6" fill="#0ea5e9" stroke="#0f172a" strokeWidth="2" /> {/* Sky-500 */}
    </svg>
  );
};

export default Logo;