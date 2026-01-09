import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepperProps {
  steps: {
    title: string;
    description?: string;
    content?: React.ReactNode;
  }[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export function Stepper({ steps, currentStep, onStepClick, className, orientation = "horizontal" }: StepperProps) {
  return (
    <div className={cn("flex", orientation === "horizontal" ? "flex-row items-center" : "flex-col", className)}>
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        const isUpcoming = stepNumber > currentStep;

        return (
          <div
            key={index}
            className={cn(
              "flex items-center",
              orientation === "horizontal" && "flex-1",
              orientation === "vertical" && "mb-4 last:mb-0"
            )}
          >
            {/* Step Circle */}
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                isCompleted && "border-primary bg-primary text-primary-foreground",
                isCurrent && "border-primary bg-background text-primary",
                isUpcoming && "border-muted-foreground bg-background text-muted-foreground",
                onStepClick && "hover:border-primary cursor-pointer"
              )}
              onClick={() => onStepClick?.(stepNumber)}
            >
              {isCompleted ? <Check className="h-4 w-4" /> : <span className="text-sm font-medium">{stepNumber}</span>}
            </div>

            {/* Step Content */}
            <div
              className={cn("ml-3", orientation === "horizontal" && "flex-1", orientation === "vertical" && "flex-1")}
            >
              <div
                className={cn(
                  "text-sm font-medium",
                  isCompleted && "text-primary",
                  isCurrent && "text-foreground",
                  isUpcoming && "text-muted-foreground"
                )}
              >
                {step.title}
              </div>
              {step.description && <div className="text-muted-foreground text-xs">{step.description}</div>}
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1",
                  orientation === "horizontal" ? "bg-border mx-4 h-0.5" : "bg-border mt-2 h-4 w-0.5 self-center"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
