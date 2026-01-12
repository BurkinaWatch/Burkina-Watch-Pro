import logoImage from "@/assets/logo-burkinawatch.png";

interface BurkinaWatchLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export default function BurkinaWatchLogo({ size = 48, showText = false, className = "" }: BurkinaWatchLogoProps) {
  const textSize = size * 0.5;
  
  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <img
        src={logoImage}
        alt="Burkina Watch Logo"
        width={size * 1.4}
        height={size}
        className="object-contain drop-shadow-lg"
        style={{ 
          width: size * 1.4, 
          height: size,
          objectFit: 'contain'
        }}
      />
      
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
