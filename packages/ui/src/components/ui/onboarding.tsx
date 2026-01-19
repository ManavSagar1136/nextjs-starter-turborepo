import * as React from "react";
import { X, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Progress } from "./progress";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  image?: string;
  video?: string;
  isCompleted?: boolean;
  isOptional?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface OnboardingProps {
  steps: OnboardingStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete?: () => void;
  onSkip?: () => void;
  onClose?: () => void;
  className?: string;
  variant?: "modal" | "fullscreen" | "sidebar";
  showProgress?: boolean;
  allowSkip?: boolean;
  showCloseButton?: boolean;
}

export function Onboarding({
  steps,
  currentStep,
  onStepChange,
  onComplete,
  onSkip,
  onClose,
  className,
  variant = "modal",
  showProgress = true,
  allowSkip = true,
  showCloseButton = true,
}: OnboardingProps) {
  const [completedSteps, setCompletedSteps] = React.useState<Set<number>>(new Set());

  const progress = ((currentStep + 1) / steps.length) * 100;

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
    onSkip?.();
  };

  const handleClose = () => {
    onClose?.();
  };

  const currentStepData = steps[currentStep];

  const content = (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Welcome!</h2>
          {currentStepData.isOptional && (
            <Badge variant="outline" className="text-xs">
              Optional
            </Badge>
          )}
        </div>
        {showCloseButton && (
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Progress */}
      {showProgress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>
              Step {currentStep + 1} of {steps.length}
            </span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Content */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold">{currentStepData.title}</h3>
          <p className="text-muted-foreground mt-1">{currentStepData.description}</p>
        </div>

        {/* Media */}
        {(currentStepData.image || currentStepData.video) && (
          <div className="bg-muted aspect-video overflow-hidden rounded-lg">
            {currentStepData.video ? (
              <video src={currentStepData.video} autoPlay loop muted className="h-full w-full object-cover" />
            ) : currentStepData.image ? (
              <img src={currentStepData.image} alt={currentStepData.title} className="h-full w-full object-cover" />
            ) : null}
          </div>
        )}

        {/* Step Content */}
        <div>{currentStepData.content}</div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t pt-6">
        <div className="flex gap-2">
          {currentStep > 0 && (
            <Button variant="outline" onClick={handlePrevious}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
          )}
          {allowSkip && (
            <Button variant="ghost" onClick={handleSkip}>
              Skip tour
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {currentStepData.action && (
            <Button variant="outline" onClick={currentStepData.action.onClick}>
              {currentStepData.action.label}
            </Button>
          )}
          <Button onClick={handleNext}>
            {currentStep === steps.length - 1 ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Get Started
              </>
            ) : (
              <>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  if (variant === "fullscreen") {
    return (
      <div className="bg-background fixed inset-0 z-50">
        <div className="container mx-auto flex h-full items-center justify-center px-6 py-8">
          <div className="w-full max-w-2xl">{content}</div>
        </div>
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <div className="bg-background fixed right-0 top-0 z-50 h-full w-96 border-l shadow-lg">
        <div className="h-full overflow-y-auto p-6">{content}</div>
      </div>
    );
  }

  return (
    <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
        <CardContent className="p-6">{content}</CardContent>
      </Card>
    </div>
  );
}
