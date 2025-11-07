import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { cn } from './utils';

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
  variant?: 'default' | 'card' | 'inline';
}

/**
 * Error display component với retry button
 */
export function ErrorDisplay({ 
  error, 
  onRetry, 
  retryText = 'Thử lại',
  className,
  variant = 'default'
}: ErrorDisplayProps) {
  const content = (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
        <AlertCircle className="h-5 w-5" />
        <p className="text-sm font-medium">{error}</p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          {retryText}
        </Button>
      )}
    </div>
  );

  if (variant === 'card') {
    return (
      <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
        <CardContent className="p-6">
          {content}
        </CardContent>
      </Card>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="text-sm text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-500/10 p-3 rounded-lg border border-red-200/50 dark:border-red-500/20">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p>{error}</p>
            {onRetry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRetry}
                className="mt-2 h-auto py-1 px-2 text-xs gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                {retryText}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="flex flex-col items-center justify-center p-8">
      {content}
    </div>
  );
}

