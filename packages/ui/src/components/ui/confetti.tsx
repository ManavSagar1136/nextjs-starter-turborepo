import * as React from "react";
import { cn } from "../../lib/utils";

export interface ConfettiProps {
  active?: boolean;
  onComplete?: () => void;
  className?: string;
  colors?: string[];
  particleCount?: number;
  spread?: number;
  startVelocity?: number;
  gravity?: number;
  duration?: number;
  recycle?: boolean;
}

export function Confetti({
  active = false,
  onComplete,
  className,
  colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"],
  particleCount = 50,
  spread = 45,
  startVelocity = 45,
  gravity = 0.5,
  duration = 3000,
  recycle = true,
}: ConfettiProps) {
  const [particles, setParticles] = React.useState<
    Array<{
      id: number;
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      rotation: number;
      rotationSpeed: number;
    }>
  >([]);

  const animationRef = React.useRef<number>(0);
  const startTimeRef = React.useRef<number>(0);

  const createParticle = (id: number) => {
    const angle = (Math.random() - 0.5) * spread * (Math.PI / 180);
    const velocity = startVelocity * (0.5 + Math.random() * 0.5);

    return {
      id,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity - Math.random() * 20,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 2 + Math.random() * 4,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
    };
  };

  const animate = (timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }

    const elapsed = timestamp - startTimeRef.current;

    setParticles(prev => {
      const newParticles = prev
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vy: particle.vy + gravity,
          rotation: particle.rotation + particle.rotationSpeed,
        }))
        .filter(
          particle => particle.y < window.innerHeight + 100 && particle.x > -100 && particle.x < window.innerWidth + 100
        );

      // Add new particles if recycling and we have space
      if (recycle && newParticles.length < particleCount && elapsed < duration) {
        const newParticle = createParticle(Date.now() + Math.random());
        newParticles.push(newParticle);
      }

      return newParticles;
    });

    if (elapsed < duration) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      setParticles([]);
      onComplete?.();
    }
  };

  React.useEffect(() => {
    if (active) {
      startTimeRef.current = 0;
      setParticles(Array.from({ length: particleCount }, (_, i) => createParticle(i)));
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setParticles([]);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [active, particleCount, spread, startVelocity, gravity, duration, recycle, colors]);

  if (!active || particles.length === 0) {
    return null;
  }

  return (
    <div className={cn("pointer-events-none fixed inset-0 z-50", className)}>
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute h-2 w-2 rounded-full"
          style={{
            left: particle.x,
            top: particle.y,
            backgroundColor: particle.color,
            width: particle.size,
            height: particle.size,
            transform: `rotate(${particle.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}

// Hook for easy confetti triggering
export function useConfetti() {
  const [active, setActive] = React.useState(false);

  const trigger = React.useCallback((options?: { duration?: number; particleCount?: number; colors?: string[] }) => {
    setActive(true);

    // Auto-deactivate after duration
    const duration = options?.duration || 3000;
    setTimeout(() => {
      setActive(false);
    }, duration);
  }, []);

  return { active, trigger };
}

// Pre-configured confetti variants
export function SuccessConfetti({ active, onComplete }: { active?: boolean; onComplete?: () => void }) {
  return (
    <Confetti
      active={active}
      onComplete={onComplete}
      colors={["#10b981", "#34d399", "#6ee7b7"]}
      particleCount={100}
      spread={60}
    />
  );
}

export function CelebrationConfetti({ active, onComplete }: { active?: boolean; onComplete?: () => void }) {
  return (
    <Confetti
      active={active}
      onComplete={onComplete}
      colors={["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"]}
      particleCount={150}
      spread={70}
      duration={4000}
    />
  );
}

export function BirthdayConfetti({ active, onComplete }: { active?: boolean; onComplete?: () => void }) {
  return (
    <Confetti
      active={active}
      onComplete={onComplete}
      colors={["#fbbf24", "#f59e0b", "#d97706", "#92400e"]}
      particleCount={200}
      spread={80}
      duration={5000}
    />
  );
}
