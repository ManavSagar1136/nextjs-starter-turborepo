/**
 * Custom Render Utilities
 *
 * Provides a custom render function that wraps components with common providers,
 * and re-exports all React Testing Library utilities for convenience.
 *
 * @example
 * ```tsx
 * import { render, screen, userEvent, within } from '@buildbase/testing';
 *
 * it('renders and interacts', async () => {
 *   const { user } = render(<MyComponent />);
 *
 *   await user.click(screen.getByRole('button'));
 *   expect(screen.getByText('Clicked!')).toBeInTheDocument();
 * });
 * ```
 */

import * as React from "react";
import {
  render as rtlRender,
  cleanup,
  renderHook,
  act,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react";
import { screen, within, waitFor } from "@testing-library/dom";
import userEvent, { type UserEvent } from "@testing-library/user-event";

// ============================================================================
// Provider Wrapper
// ============================================================================

export interface WrapperProps {
  children: React.ReactNode;
}

export interface RenderProvidersOptions {
  /**
   * Initial route for testing navigation
   */
  route?: string;

  /**
   * Additional wrapper components
   */
  wrapper?: React.ComponentType<WrapperProps>;
}

/**
 * Creates a wrapper component with all providers
 */
function createWrapper(options: RenderProvidersOptions = {}) {
  const { wrapper: AdditionalWrapper } = options;

  return function Wrapper({ children }: WrapperProps) {
    // Base wrapper - just renders children
    // Add providers here as needed (QueryClient, Redux, etc.)
    let content = <>{children}</>;

    // Wrap with additional wrapper if provided
    if (AdditionalWrapper) {
      content = <AdditionalWrapper>{content}</AdditionalWrapper>;
    }

    return content;
  };
}

// ============================================================================
// Custom Render Function
// ============================================================================

export interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  /**
   * Initial route for testing navigation
   */
  route?: string;

  /**
   * Additional wrapper component
   */
  wrapper?: React.ComponentType<WrapperProps>;
}

export interface CustomRenderResult extends RenderResult {
  /**
   * User event instance for simulating user interactions
   */
  user: UserEvent;
}

/**
 * Custom render function with providers and userEvent setup
 *
 * @param ui - React element to render
 * @param options - Render options
 * @returns Render result with user event instance
 *
 * @example
 * ```tsx
 * const { user, getByRole } = render(<Button onClick={fn}>Click</Button>);
 * await user.click(getByRole('button'));
 * ```
 */
export function render(ui: React.ReactElement, options: CustomRenderOptions = {}): CustomRenderResult {
  const { route, wrapper, ...renderOptions } = options;

  // Create user event instance
  const user = userEvent.setup();

  // Create wrapper with providers
  const Wrapper = createWrapper({ route, wrapper });

  // Render with wrapper
  const result = rtlRender(ui, {
    wrapper: Wrapper,
    ...renderOptions,
  });

  return {
    ...result,
    user,
  };
}

// ============================================================================
// Re-exports from Testing Library
// ============================================================================

// Core utilities from @testing-library/dom
export { screen, within, waitFor };

// Core utilities from @testing-library/react
export { cleanup, act, renderHook };

// User event
export { userEvent };

// Types
export type { RenderOptions, RenderResult, UserEvent };

// ============================================================================
// Additional Utilities
// ============================================================================

/**
 * Render a hook with custom wrapper
 *
 * @param hook - Hook to render
 * @param options - Render options
 */
export function renderHookWithProviders<Result, Props>(
  hook: (props: Props) => Result,
  options: CustomRenderOptions = {}
) {
  const { route, wrapper, ...renderOptions } = options;
  const Wrapper = createWrapper({ route, wrapper });

  return renderHook(hook, {
    wrapper: Wrapper,
    ...renderOptions,
  });
}

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Type text into an input element
 *
 * @param element - Input element
 * @param text - Text to type
 */
export async function typeIntoInput(element: HTMLElement, text: string): Promise<void> {
  const user = userEvent.setup();
  await user.clear(element);
  await user.type(element, text);
}

/**
 * Select an option from a select element
 *
 * @param element - Select element
 * @param value - Value to select
 */
export async function selectOption(element: HTMLElement, value: string): Promise<void> {
  const user = userEvent.setup();
  await user.selectOptions(element, value);
}

// Default export for convenience
export default render;
