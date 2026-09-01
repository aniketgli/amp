import React from 'react';
import { useBranding } from '../../utils/brandingStore';

interface WiiLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  showSubtitle?: boolean;
}

export const WiiLogo: React.FC<WiiLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  showSubtitle = true,
}) => {
  const branding = useBranding();

  const sizeClasses = {
    sm: 'h-10 sm:h-12',
    md: 'h-14 sm:h-16',
    lg: 'h-20 sm:h-24',
  };

  const imgHeightClasses = {
    sm: 'h-10 sm:h-12 max-h-14',
    md: 'h-14 sm:h-18 max-h-22',
    lg: 'h-20 sm:h-26 max-h-32',
  };

  const textSizes = {
    sm: { hindi: 'text-xs font-bold', english: 'text-xs sm:text-sm font-extrabold tracking-tight' },
    md: { hindi: 'text-sm sm:text-base font-bold', english: 'text-base sm:text-lg font-extrabold' },
    lg: { hindi: 'text-lg sm:text-xl font-bold', english: 'text-xl sm:text-2xl font-extrabold' },
  };

  const subtitleSizes = {
    sm: 'text-[9px] sm:text-[10px]',
    md: 'text-[10px] sm:text-xs',
    lg: 'text-xs sm:text-sm',
  };

  // If a custom image logo is uploaded via Master
  if (branding.logoUrl) {
    return (
      <div className={`flex flex-col select-none ${className}`}>
        <div className="flex items-center">
          <img
            src={branding.logoUrl}
            alt={branding.englishName || "Company Logo"}
            className={`object-contain ${imgHeightClasses[size]} w-auto shrink-0`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col select-none ${className}`}>
      <div className="flex items-center gap-3">
        {/* Official WII Deer & Leafy Antlers Emblem */}
        <div className={`aspect-square shrink-0 flex items-center justify-center ${sizeClasses[size]}`}>
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full fill-current"
            style={{ color: branding.primaryColor || '#7A1C1C' }}
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
              className={`font-serif leading-tight ${textSizes[size].hindi}`}
              style={{ color: branding.primaryColor || '#7A1C1C', fontFamily: "'Cambria', 'Georgia', serif" }}
            >
              {branding.hindiName}
            </div>
            <div
              className={`font-serif leading-tight ${textSizes[size].english}`}
              style={{ color: branding.primaryColor || '#7A1C1C', fontFamily: "'Times New Roman', 'Cambria', serif" }}
            >
              {branding.englishName}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

