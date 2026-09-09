import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useOnboarding } from '@/hooks/use-onboarding';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface OnboardingTipProps {
  id: string;
  children: React.ReactNode;
  content: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export function OnboardingTip({ 
  id, 
  children, 
  content, 
  side = 'top',
  delay = 500 
}: OnboardingTipProps) {
  const { showTips, hasSeenTip, markTipAsSeen } = useOnboarding();
  const [isOpen, setIsOpen] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (showTips && !hasSeenTip(id)) {
      const timer = setTimeout(() => {
        setShouldShow(true);
        setIsOpen(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [showTips, hasSeenTip, id, delay]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(false);
    markTipAsSeen(id);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && shouldShow) {
      markTipAsSeen(id);
    }
    setIsOpen(open);
  };

  if (!showTips || hasSeenTip(id)) {
    return <>{children}</>;
  }

  return (
    <Tooltip open={isOpen} onOpenChange={handleOpenChange}>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent 
        side={side} 
        className="relative bg-primary text-primary-foreground border-primary max-w-[200px] pr-6"
      >
        <p className="text-xs">{content}</p>
        <button
          onClick={handleDismiss}
          className="absolute top-1 right-1 p-0.5 rounded hover:bg-primary-foreground/20 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-3 h-3" />
        </button>
      </TooltipContent>
    </Tooltip>
  );
}
