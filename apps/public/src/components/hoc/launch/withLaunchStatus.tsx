"use client";

import { isProductLaunched } from "@/lib/utils/launch-status";

/**
 * Options for launch status HOC
 */
interface WithLaunchStatusOptions {
  /**
   * If true, component only renders when product IS launched
   * If false, component only renders when product IS NOT launched (pre-launch)
   * @default true
   */
  requireLaunched?: boolean;
  /**
   * Fallback component to render when condition is not met
   * @default null
   */
  fallback?: React.ReactNode;
}

/**
 * Higher Order Component that conditionally renders components based on launch status
 *
 * Prevents unnecessary re-renders and hook executions when component should be hidden
 *
 * @example
 * // Only render when product is launched
 * export default withLaunchStatus(MyComponent);
 *
 * @example
 * // Only render when product is NOT launched (pre-launch)
 * export default withLaunchStatus(MyComponent, { requireLaunched: false });
 *
 * @example
 * // With custom fallback
 * export default withLaunchStatus(MyComponent, {
 *   fallback: <div>Coming soon...</div>
 * });
 */
export function withLaunchStatus<P extends object>(
  Component: React.ComponentType<P>,
  options: WithLaunchStatusOptions = {},
) {
  const { requireLaunched = true, fallback = null } = options;

  return function LaunchStatusWrapper(props: P) {
    const isLaunched = isProductLaunched();

    // If requireLaunched is true, only render when launched
    // If requireLaunched is false, only render when NOT launched
    const shouldRender = requireLaunched ? isLaunched : !isLaunched;

    if (!shouldRender) {
      return <>{fallback}</>;
    }

    return <Component {...props} />;
  };
}

/**
 * Convenience HOC: Only renders component when product IS launched
 *
 * @example
 * export default withPostLaunchOnly(MyComponent);
 */
export function withPostLaunchOnly<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode,
) {
  return withLaunchStatus(Component, {
    requireLaunched: true,
    fallback,
  });
}

/**
 * Convenience HOC: Only renders component when product IS NOT launched (pre-launch)
 *
 * @example
 * export default withPreLaunchOnly(MyComponent);
 */
export function withPreLaunchOnly<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode,
) {
  return withLaunchStatus(Component, {
    requireLaunched: false,
    fallback,
  });
}
