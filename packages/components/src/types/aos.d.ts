declare module "aos" {
  interface AOSOptions {
    duration?: number;
    easing?: string;
    once?: boolean;
    mirror?: boolean;
    anchorPlacement?: string;
    offset?: number;
    delay?: number;
  }

  function init(options?: AOSOptions): void;
  function refresh(): void;
  function refreshHard(): void;
}

declare module "aos/dist/aos.css";
