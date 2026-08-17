import React from 'react';

interface WiiLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const WiiLogo: React.FC<WiiLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
  };

  const textSizes = {
    sm: { hindi: 'text-[11px]', english: 'text-xs tracking-tight' },
    md: { hindi: 'text-xs sm:text-sm font-bold', english: 'text-sm sm:text-base font-extrabold' },
    lg: { hindi: 'text-base sm:text-lg font-bold', english: 'text-lg sm:text-xl font-extrabold' },
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Official WII Deer & Leafy Antlers Emblem */}
      <div className={`aspect-square shrink-0 flex items-center justify-center ${sizeClasses[size]}`}>
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full text-[#7A1C1C] fill-current"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Leaves on Antlers Left Branch */}
          <path d="M 60 25 C 50 10, 30 15, 35 30 C 42 42, 58 35, 60 25 Z" />
          <path d="M 85 20 C 78 5, 58 10, 62 25 C 68 38, 82 32, 85 20 Z" />
          <path d="M 105 30 C 100 12, 80 15, 85 30 C 90 42, 102 38, 105 30 Z" />
          <path d="M 125 25 C 120 10, 100 12, 105 28 C 112 40, 122 35, 125 25 Z" />
          
          {/* Leaves on Antlers Right Branch */}
          <path d="M 145 28 C 140 12, 122 18, 128 32 C 135 42, 142 38, 145 28 Z" />
          <path d="M 165 35 C 160 20, 142 22, 148 38 C 155 48, 162 42, 165 35 Z" />
          <path d="M 180 50 C 182 35, 165 35, 168 50 C 172 60, 178 58, 180 50 Z" />

          {/* Branching Antlers */}
          <path
            d="M 65 110 C 75 80, 100 50, 115 40 M 115 40 C 100 25, 80 20, 60 25 M 115 40 C 130 25, 150 25, 175 45 M 105 60 C 125 45, 145 40, 160 38"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Deer Head Profile */}
          <path
            d="M 65 110 C 50 112, 40 125, 45 140 C 52 155, 75 160, 95 155 C 115 150, 130 135, 125 120 C 120 108, 100 108, 95 125 C 90 140, 75 145, 75 145 C 75 145, 75 170, 75 175 M 105 145 C 105 145, 105 170, 105 175"
            fill="none"
            stroke="currentColor"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Deer Eye */}
          <circle cx="82" cy="125" r="5" />
        </svg>
      </div>

      {/* Official Text: Hindi & English */}
      {showText && (
        <div className="flex flex-col justify-center">
          <div
            className={`font-serif text-[#7A1C1C] leading-tight ${textSizes[size].hindi}`}
            style={{ fontFamily: "'Cambria', 'Georgia', serif" }}
          >
            भारतीय वन्यजीव संस्थान
          </div>
          <div
            className={`font-serif text-[#7A1C1C] leading-tight ${textSizes[size].english}`}
            style={{ fontFamily: "'Times New Roman', 'Cambria', serif" }}
          >
            Wildlife Institute of India
          </div>
        </div>
      )}
    </div>
  );
};
