declare module "canvas-confetti" {
  export interface GlobalOptions {
    resize?: boolean;
    useWorker?: boolean;
    disableForReducedMotion?: boolean;
  }

  export interface Options {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: {
      x?: number;
      y?: number;
    };
    colors?: string[];
    shapes?: ("square" | "circle")[];
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
  }

  export type CreateTypes = ((options?: Options) => Promise<null> | null) & {
    reset: () => void;
  };

  export interface ConfettiInstance {
    create: (canvas: HTMLCanvasElement, options?: GlobalOptions) => CreateTypes;
    reset: () => void;
    (options?: Options): Promise<null> | null;
  }

  const confettiInstance: ConfettiInstance;
  export default confettiInstance;
}
