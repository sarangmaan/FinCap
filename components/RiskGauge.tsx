import React from 'react';

interface RiskGaugeProps {
  score: number;
  label: string;
  type?: 'risk' | 'bubble';
}

const RiskGauge: React.FC<RiskGaugeProps> = ({ score, label }) => {
  // SVG Configuration
  // Increased radius (35->45) and stroke (8->10) for better visual ratio
  const radius = 45;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - ((score / 100) * circumference);
  
  // Color Logic (Matching Screenshot: 45/35 is Yellow/Amber 'Caution')
  const getColor = (s: number) => {
    if (s < 35) return 'text-emerald-400'; // Stable
    if (s < 70) return 'text-amber-400';   // Caution
    return 'text-rose-500';                // Critical
  };
  
  const getBgColor = (s: number) => {
    if (s < 35) return 'bg-emerald-400';
    if (s < 70) return 'bg-amber-400';
    return 'bg-rose-500';
  };
  
  const colorClass = getColor(score);
  const bgColorClass = getBgColor(score);
  
  const statusText = score < 35 ? 'Stable' : score < 70 ? 'Caution' : 'Critical';

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 hover:border-slate-600 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden h-64 shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:scale-[1.02] transition-all duration-300 ease-out">
       
       {/* Gauge Circle - Increased container size w-32 -> w-40 */}
       <div className="relative w-40 h-40 flex items-center justify-center z-10 mb-3">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
             {/* Background Circle */}
             <circle
               cx="64"
               cy="64"
               r={radius}
               stroke="#1f2937"
               strokeWidth={strokeWidth}
               fill="transparent"
             />
             {/* Progress Circle */}
             <circle
               cx="64"
               cy="64"
               r={radius}
               stroke="currentColor"
               strokeWidth={strokeWidth}
               fill="transparent"
               strokeDasharray={circumference}
               strokeDashoffset={offset}
               strokeLinecap="round"
               className={`${colorClass} transition-all duration-1000 ease-out`}
             />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
             <span className={`text-5xl font-black ${colorClass}`}>{score}</span>
             <span className="text-xs text-slate-500 font-bold uppercase mt-1">/ 100</span>
          </div>
       </div>

       {/* Label - Larger text */}
       <h3 className="text-white text-xl font-bold mb-2 z-10">{label}</h3>

       {/* Pill */}
       <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-900 ${bgColorClass}`}>
           {statusText}
       </div>
    </div>
  );
};

export default RiskGauge;