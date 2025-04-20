import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Step {
  id: string;
  name: string;
  status: "complete" | "current" | "upcoming";
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
}

export function ProgressSteps({ steps, currentStep }: ProgressStepsProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, stepIdx) => (
          <div
            key={step.id}
            className={cn("w-full flex items-center", {
              "justify-center": stepIdx === 0 || stepIdx === steps.length - 1,
            })}
          >
            <div className="flex items-center">
              <div
                className={cn(
                  "z-10 flex items-center justify-center w-10 h-10 rounded-full",
                  {
                    "bg-primary-600": step.status === "complete" || step.status === "current",
                    "bg-gray-300": step.status === "upcoming",
                  }
                )}
              >
                {step.status === "complete" ? (
                  <Check className="w-6 h-6 text-white" />
                ) : (
                  <span
                    className={cn("text-white font-medium", {
                      "text-gray-500": step.status === "upcoming",
                    })}
                  >
                    {stepIdx + 1}
                  </span>
                )}
              </div>
              <div className="ml-3">
                <p
                  className={cn("text-sm font-medium", {
                    "text-gray-900": step.status === "complete" || step.status === "current",
                    "text-gray-500": step.status === "upcoming",
                  })}
                >
                  {step.name}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="h-0.5 w-full bg-gray-200">
            <div
              className="h-0.5 bg-primary-600"
              style={{
                width: `${Math.max(0, (currentStep - 1) / (steps.length - 1)) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
