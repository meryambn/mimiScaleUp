import React from "react";
import { CheckCircle, CircleSlash } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepStatus = "complete" | "current" | "upcoming";

export interface Step {
  id: string;
  name: string;
  status: StepStatus;
}

interface EnhancedProgressStepsProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export const EnhancedProgressSteps: React.FC<EnhancedProgressStepsProps> = ({
  steps,
  currentStep,
  className,
}) => {
  return (
    <div className={cn("mb-8", className)}>
      <div className="flex flex-wrap items-center">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex items-center">
                <div className={cn(
                  "flex items-center justify-center",
                  "relative w-12 h-12 rounded-full shadow-md border-2",
                  step.status === "complete" ? "bg-primary-600 border-primary-700 text-white" : 
                  step.status === "current" ? "bg-white border-primary-600 text-primary-700" :
                  "bg-white border-gray-300 text-gray-400",
                  "transition-all duration-300"
                )}>
                  <div className="absolute inset-0 rounded-full overflow-hidden">
                    {step.status === "complete" && (
                      <div className="absolute inset-0 bg-primary-500 opacity-30 animate-pulse"></div>
                    )}
                    {step.status === "current" && (
                      <div className="absolute inset-0 bg-primary-100 opacity-50"></div>
                    )}
                  </div>
                  
                  {step.status === "complete" ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <span className="text-lg font-bold">{step.id}</span>
                  )}
                </div>
                
                <div className={cn(
                  "ml-3 flex flex-col items-start",
                  step.status === "complete" ? "text-primary-700" : 
                  step.status === "current" ? "text-gray-900" : 
                  "text-gray-500",
                )}>
                  <span className={cn(
                    "text-sm font-medium",
                    step.status === "current" && "font-semibold"
                  )}>
                    Step {step.id}
                  </span>
                  <span className={cn(
                    "text-base",
                    step.status === "current" ? "font-medium" : "font-normal"
                  )}>
                    {step.name}
                  </span>
                </div>
              </div>
              
              {!isLast && (
                <div 
                  className={cn(
                    "flex-grow mx-2 h-0.5 rounded-full",
                    index < currentStep - 1 ? "bg-primary-500" : "bg-gray-200",
                    "transition-all duration-300"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EnhancedProgressSteps;