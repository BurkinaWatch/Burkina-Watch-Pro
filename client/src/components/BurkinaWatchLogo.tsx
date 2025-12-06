
interface BurkinaWatchLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export default function BurkinaWatchLogo({ size = 48, showText = false, className = "" }: BurkinaWatchLogoProps) {
  const textSize = size * 0.5;
  
  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        {/* Burkina Faso map shape with flag colors */}
        <g>
          {/* Red top section */}
          <path
            d="M60 20 C75 22, 88 28, 95 35 C100 40, 103 45, 105 50 L60 60 Z"
            fill="#EF2B2D"
          />
          {/* Yellow middle section */}
          <path
            d="M105 50 C107 55, 108 60, 108 65 C108 70, 107 75, 105 80 L60 60 Z"
            fill="#FCD116"
          />
          {/* Green bottom section */}
          <path
            d="M105 80 C100 90, 88 98, 75 102 C65 105, 55 105, 45 102 C32 98, 20 90, 15 80 L60 60 Z"
            fill="#00A651"
          />
          {/* Red-yellow left sections */}
          <path
            d="M15 80 C12 75, 10 70, 10 65 C10 60, 12 55, 15 50 L60 60 Z"
            fill="#FCD116"
          />
          <path
            d="M15 50 C20 40, 32 28, 45 22 C52 19, 56 19, 60 20 L60 60 Z"
            fill="#EF2B2D"
          />
        </g>
        
        {/* Eye in center */}
        <g>
          {/* Outer eye shape */}
          <ellipse
            cx="60"
            cy="60"
            rx="24"
            ry="16"
            fill="#2C2C2C"
            className="drop-shadow-md"
          />
          
          {/* Iris */}
          <ellipse
            cx="60"
            cy="60"
            rx="14"
            ry="14"
            fill="#4A4A4A"
          />
          
          {/* Pupil */}
          <circle
            cx="60"
            cy="60"
            r="8"
            fill="#1A1A1A"
          />
          
          {/* Highlight */}
          <circle
            cx="57"
            cy="56"
            r="3"
            fill="white"
            opacity="0.6"
          />
        </g>
      </svg>
      
      {showText && (
        <div className="flex flex-col items-center -mt-1">
          <span
            className="font-black text-gray-800 dark:text-gray-200 tracking-tight leading-none"
            style={{ fontSize: `${textSize}px` }}
          >
            BURKINA
          </span>
          <span
            className="font-black text-gray-800 dark:text-gray-200 tracking-tight leading-none"
            style={{ fontSize: `${textSize}px` }}
          >
            WATCH
          </span>
        </div>
      )}
    </div>
  );
}
