// src/components/ui/logo.jsx
import React from 'react';

export const TeamSyncLogo = ({ className = "w-8 h-8" }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
        {/* The Icon Shape */}
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-indigo-500">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        
        {/* Optional: Glow effect behind it */}
        <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-40 -z-10"></div>
    </div>
  );
};

export const LogoText = () => {
    return (
        <div className="flex flex-col items-start">
            <span className="font-bold text-white leading-none tracking-tight">TeamSync</span>
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Conflict Resolver</span>
        </div>
    )
}