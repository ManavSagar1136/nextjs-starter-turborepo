import * as React from "react";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  content: React.ReactNode;
  isCompleted?: boolean;
  isOptional?: boolean;
  validation?: () => boolean;
}

export interface WizardProps {
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete?: () => void;
  onCancel?: () => void;
  className?: string;
  variant?: "default" | "vertical" | "minimal";
  showProgress?: boolean;
  allowSkip?: boolean;
}

export function Wizard({
  steps,
  currentStep,
  onStepChange,
  onComplete,
  onCancel,
  className,
  variant = "default",
  showProgress = true,
  allowSkip = false,
}: WizardProps) {
  const [completedSteps, setCompletedSteps] = React.useState<Set<number>>(new Set());

  const isStepCompleted = (stepIndex: number) => {
    return completedSteps.has(stepIndex) || steps[stepIndex].isCompleted;
  };

  const isStepAccessible = (stepIndex: number) => {
    if (stepIndex === 0) return true;
    if (allowSkip) return true;
    return isStepCompleted(stepIndex - 1);
  };

  const handleStepClick = (stepIndex: number) => {
    if (isStepAccessible(stepIndex)) {
      onStepChange(stepIndex);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      onStepChange(currentStep + 1);
    } else {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < steps.length - 1) {
      onStepChange(currentStep + 1);
    }
  };

  const getStepStatus = (stepIndex: number) => {
    if (isStepCompleted(stepIndex)) return "completed";
    if (stepIndex === currentStep) return "current";
    if (isStepAccessible(stepIndex)) return "accessible";
    return "locked";
  };

  const renderStepIndicator = (stepIndex: number) => {
    const status = getStepStatus(stepIndex);
    const step = steps[stepIndex];

    return (
      <div
        key={step.id}
        className={cn(
          "flex cursor-pointer items-center transition-colors",
          status === "locked" && "cursor-not-allowed opacity-50",
          status === "current" && "text-primary"
        )}
        onClick={() => handleStepClick(stepIndex)}
      >
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
            status === "completed" && "bg-primary border-primary text-primary-foreground",
            status === "current" && "border-primary text-primary",
            status === "accessible" && "border-muted-foreground text-muted-foreground",
            status === "locked" && "border-muted text-muted"
          )}
        >
          {status === "completed" ? (
            <Check className="h-4 w-4" />
          ) : (
            <span className="text-sm font-medium">{stepIndex + 1}</span>
          )}
        </div>
        <div className="ml-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">{step.title}</h3>
            {step.isOptional && (
              <Badge variant="outline" className="text-xs">
                Optional
              </Badge>
            )}
          </div>
          {step.description && <p className="text-muted-foreground text-xs">{step.description}</p>}
        </div>
      </div>
    );
  };

  if (variant === "vertical") {
    return (
      <div className={cn("flex gap-8", className)}>
        {/* Steps Sidebar */}
        <div className="w-64 space-y-4">{steps.map((_, index) => renderStepIndicator(index))}</div>

        {/* Content */}
        <div className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle>{steps[currentStep].title}</CardTitle>
              {steps[currentStep].description && (
                <p className="text-muted-foreground">{steps[currentStep].description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {steps[currentStep].content}

              {/* Navigation */}
              <div className="flex justify-between border-t pt-6">
                <div className="flex gap-2">
                  {currentStep > 0 && (
                    <Button variant="outline" onClick={handlePrevious}>
                      Previous
                    </Button>
                  )}
                  {onCancel && (
                    <Button variant="ghost" onClick={onCancel}>
                      Cancel
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  {allowSkip && currentStep < steps.length - 1 && (
                    <Button variant="ghost" onClick={handleSkip}>
                      Skip
                    </Button>
                  )}
                  <Button onClick={handleNext}>{currentStep === steps.length - 1 ? "Complete" : "Next"}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className={cn("space-y-6", className)}>
        {/* Progress */}
        {showProgress && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                    getStepStatus(index) === "completed" && "bg-primary border-primary text-primary-foreground",
                    getStepStatus(index) === "current" && "border-primary text-primary",
                    getStepStatus(index) === "accessible" && "border-muted-foreground text-muted-foreground",
                    getStepStatus(index) === "locked" && "border-muted text-muted"
                  )}
                >
                  {getStepStatus(index) === "completed" ? <Check className="h-4 w-4" /> : index + 1}
                </div>
              ))}
            </div>
            <span className="text-muted-foreground text-sm">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">{steps[currentStep].title}</h2>
            {steps[currentStep].description && (
              <p className="text-muted-foreground">{steps[currentStep].description}</p>
            )}
          </div>
          {steps[currentStep].content}
        </div>

        {/* Navigation */}
        <div className="flex justify-between border-t pt-4">
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                Previous
              </Button>
            )}
            {onCancel && (
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {allowSkip && currentStep < steps.length - 1 && (
              <Button variant="ghost" onClick={handleSkip}>
                Skip
              </Button>
            )}
            <Button onClick={handleNext}>{currentStep === steps.length - 1 ? "Complete" : "Next"}</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Steps */}
      <div className="flex items-center justify-between">
        {steps.map((_, index) => (
          <React.Fragment key={index}>
            {renderStepIndicator(index)}
            {index < steps.length - 1 && <ChevronRight className="text-muted-foreground mx-4 h-4 w-4" />}
          </React.Fragment>
        ))}
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep].title}</CardTitle>
          {steps[currentStep].description && <p className="text-muted-foreground">{steps[currentStep].description}</p>}
        </CardHeader>
        <CardContent className="space-y-6">
          {steps[currentStep].content}

          {/* Navigation */}
          <div className="flex justify-between border-t pt-6">
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handlePrevious}>
                  Previous
                </Button>
              )}
              {onCancel && (
                <Button variant="ghost" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {allowSkip && currentStep < steps.length - 1 && (
                <Button variant="ghost" onClick={handleSkip}>
                  Skip
                </Button>
              )}
              <Button onClick={handleNext}>{currentStep === steps.length - 1 ? "Complete" : "Next"}</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
