import React from 'react';
import { Battery, BatteryCharging } from 'lucide-react';
import { cn } from './utils';

interface BatteryLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'rotate' | 'charging';
  className?: string;
}

/**
 * Custom loading spinner với icon Pin
 * - variant 'rotate': Pin xoay vòng
 * - variant 'charging': Pin sạc đầy dần (animated fill)
 */
export function BatteryLoading({ 
  size = 'md', 
  variant = 'rotate',
  className 
}: BatteryLoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  if (variant === 'charging') {
    return (
      <div className={cn('relative inline-flex items-center justify-center', className)}>
        <BatteryCharging 
          className={cn(
            sizeClasses[size],
            'text-blue-600 dark:text-blue-400 animate-pulse'
          )} 
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn(
            'border-2 border-blue-600 dark:border-blue-400 rounded-sm',
            sizeClasses[size]
          )} style={{
            clipPath: 'inset(0 0 0 0)',
            animation: 'battery-charge 2s ease-in-out infinite'
          }} />
        </div>
        <style>{`
          @keyframes battery-charge {
            0%, 100% { clip-path: inset(100% 0 0 0); }
            50% { clip-path: inset(0 0 0 0); }
          }
        `}</style>
      </div>
    );
  }

  // Default: rotate variant
  return (
    <div className={cn('inline-flex items-center justify-center', className)}>
      <Battery 
        className={cn(
          sizeClasses[size],
          'text-blue-600 dark:text-blue-400 animate-spin'
        )} 
      />
    </div>
  );
}

/**
 * Full loading spinner với text
 */
interface BatterySpinnerProps extends BatteryLoadingProps {
  text?: string;
  fullScreen?: boolean;
}

export function BatterySpinner({ 
  text = 'Đang tải...', 
  fullScreen = false,
  ...props 
}: BatterySpinnerProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <BatteryLoading {...props} size={props.size || 'lg'} />
      {text && (
        <p className="text-sm text-slate-600 dark:text-slate-400 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      {content}
    </div>
  );
}

