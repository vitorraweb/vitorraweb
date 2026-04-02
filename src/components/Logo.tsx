import React from 'react';

interface LogoProps {
  className?: string;
  goldColor?: string;
}

export default function Logo({ className = "w-48", goldColor = "var(--vitorra-gold)" }: LogoProps) {
  return (
    <svg 
      viewBox="0 0 400 115" 
      className={className} 
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Vitorra Holdings Limited Logo"
    >
      <g fill={goldColor}>
        <text 
          x="200" 
          y="65" 
          fontFamily="Georgia, 'Times New Roman', serif" 
          fontSize="68" 
          fontWeight="bold" 
          textAnchor="middle" 
          letterSpacing="0.02em"
        >
          VITORRA
        </text>
        <text 
          x="205" 
          y="92" 
          fontFamily="Montserrat, system-ui, sans-serif" 
          fontSize="13" 
          fontWeight="bold" 
          textAnchor="middle" 
          letterSpacing="0.4em" 
          opacity="0.9"
        >
          HOLDINGS LIMITED
        </text>
        <line 
          x1="140" 
          y1="108" 
          x2="260" 
          y2="108" 
          stroke={goldColor} 
          strokeWidth="2.5" 
          opacity="0.8" 
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
