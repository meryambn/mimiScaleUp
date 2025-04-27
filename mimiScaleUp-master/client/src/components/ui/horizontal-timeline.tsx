import React from 'react';
import { cn } from '@/lib/utils';

export interface TimelineStep {
  label: string;
  state: 'completed' | 'current' | 'upcoming';
  color: string;
}

interface HorizontalTimelineProps {
  steps: TimelineStep[];
  className?: string;
}

export const HorizontalTimeline: React.FC<HorizontalTimelineProps> = ({ steps, className }) => {
  return (
    <div className={cn("relative", className)}>
      {/* Progress bar */}
      <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200">
        <div 
          className="absolute h-full bg-primary transition-all duration-500"
          style={{ 
            width: `${(steps.filter(step => step.state === 'completed').length / steps.length) * 100}%`
          }}
        />
      </div>

      {/* Steps */}
      <div className="relative flex justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center">
            {/* Step circle */}
            <div 
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-colors duration-200",
                step.state === 'completed' && "bg-green-500 text-white",
                step.state === 'current' && "bg-primary text-white",
                step.state === 'upcoming' && "bg-gray-200 text-gray-500"
              )}
            >
              {step.state === 'completed' ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>

            {/* Step label */}
            <span className="text-sm font-medium text-gray-700">{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HorizontalTimeline;