import * as React from "react";
import { X, ArrowRight, ArrowLeft, Target } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { Badge } from "./badge";

export interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector or element ref
  position?: "top" | "bottom" | "left" | "right" | "center";
  action?: {
    label: string;
    onClick: () => void;
  };
  isCompleted?: boolean;
}

export interface TourProps {
  steps: TourStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete?: () => void;
  onSkip?: () => void;
  onClose?: () => void;
  className?: string;
  variant?: "overlay" | "modal" | "tooltip";
  showProgress?: boolean;
  allowSkip?: boolean;
  showCloseButton?: boolean;
}

export function Tour({
  steps,
  currentStep,
  onStepChange,
  onComplete,
  onSkip,
  onClose,
  className,
  variant = "overlay",
  showProgress = true,
  allowSkip = true,
  showCloseButton = true,
}: TourProps) {
  const [targetElement, setTargetElement] = React.useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = React.useState({
    top: 0,
    left: 0,
  });

  const currentStepData = steps[currentStep];

  React.useEffect(() => {
    const element = document.querySelector(currentStepData.target) as HTMLElement;
    if (element) {
      setTargetElement(element);

      // Calculate position
      const rect = element.getBoundingClientRect();
      const position = currentStepData.position || "bottom";

      let top = 0;
      let left = 0;

      switch (position) {
        case "top":
          top = rect.top - 10;
          left = rect.left + rect.width / 2;
          break;
        case "bottom":
          top = rect.bottom + 10;
          left = rect.left + rect.width / 2;
          break;
        case "left":
          top = rect.top + rect.height / 2;
          left = rect.left - 10;
          break;
        case "right":
          top = rect.top + rect.height / 2;
          left = rect.right + 10;
          break;
        case "center":
          top = window.innerHeight / 2;
          left = window.innerWidth / 2;
          break;
      }

      setTooltipPosition({ top, left });

      // Scroll element into view
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentStep, currentStepData]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      onStepChange(currentStep + 1);
    } else {
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

  const progress = ((currentStep + 1) / steps.length) * 100;

  const tooltipContent = (
    <Card className="w-80 shadow-lg">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="text-primary h-4 w-4" />
              <span className="text-sm font-medium">Tour Guide</span>
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
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="bg-muted h-2 w-full rounded-full">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Content */}
          <div className="space-y-2">
            <h3 className="font-semibold">{currentStepData.title}</h3>
            <p className="text-muted-foreground text-sm">{currentStepData.description}</p>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" size="sm" onClick={handlePrevious}>
                  <ArrowLeft className="mr-1 h-3 w-3" />
                  Previous
                </Button>
              )}
              {allowSkip && (
                <Button variant="ghost" size="sm" onClick={handleSkip}>
                  Skip tour
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {currentStepData.action && (
                <Button variant="outline" size="sm" onClick={currentStepData.action.onClick}>
                  {currentStepData.action.label}
                </Button>
              )}
              <Button size="sm" onClick={handleNext}>
                {currentStep === steps.length - 1 ? "Finish" : "Next"}
                {currentStep < steps.length - 1 && <ArrowRight className="ml-1 h-3 w-3" />}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (variant === "modal") {
    return (
      <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="w-full max-w-md">{tooltipContent}</div>
      </div>
    );
  }

  if (variant === "tooltip") {
    return (
      <div
        className={cn("fixed z-50", className)}
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          transform: "translate(-50%, -50%)",
        }}
      >
        {tooltipContent}
      </div>
    );
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/50" />

      {/* Highlighted Element */}
      {targetElement && (
        <div
          className="z-45 pointer-events-none fixed"
          style={{
            top: targetElement.offsetTop - 4,
            left: targetElement.offsetLeft - 4,
            width: targetElement.offsetWidth + 8,
            height: targetElement.offsetHeight + 8,
            border: "2px solid #3b82f6",
            borderRadius: "8px",
            boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.1)",
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className={cn("fixed z-50", className)}
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          transform: "translate(-50%, -50%)",
        }}
      >
        {tooltipContent}
      </div>
    </>
  );
}
