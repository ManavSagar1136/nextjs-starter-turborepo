import React from "react";

/**
 * Base props interface that all dialogs and sheets must extend.
 * This ensures that all registered components have the required props
 * that the dialog manager needs to control them.
 *
 * Both Dialog and Sheet components from Radix UI use these same props,
 * making this interface compatible with both.
 *
 * Required props are managed by the dialog manager, while optional props
 * can be passed through to customize behavior.
 */
export interface DialogOrSheetBaseProps {
  /**
   * Whether the dialog/sheet is open.
   * This is controlled by the dialog manager.
   * @required
   */
  open: boolean;

  /**
   * Callback fired when the open state changes.
   * The dialog manager uses this to track and control dialog state.
   * @required
   */
  onOpenChange: (open: boolean) => void;

  /**
   * Whether the dialog/sheet is modal.
   * When true, interaction with the rest of the page is blocked.
   * @default true
   */
  modal?: boolean;

  /**
   * Callback fired when the Escape key is pressed.
   * Can be used to prevent closing or add custom behavior.
   */
  onEscapeKeyDown?: (event: KeyboardEvent) => void;

  /**
   * Callback fired when a pointer event occurs outside the dialog/sheet.
   * Can be used to prevent closing or add custom behavior.
   */
  onPointerDownOutside?: (event: PointerEvent) => void;

  /**
   * Callback fired when an interaction occurs outside the dialog/sheet.
   * This includes pointer events, focus events, and other interactions.
   * Can be used to prevent closing or add custom behavior.
   */
  onInteractOutside?: (event: PointerEvent | FocusEvent | MouseEvent | TouchEvent) => void;

  /**
   * Callback fired when focus moves outside the dialog/sheet.
   * Can be used to prevent closing or add custom behavior.
   */
  onFocusOutside?: (event: FocusEvent) => void;

  /**
   * Callback fired when the dialog/sheet closes and focus should be restored.
   * Can be used to control where focus is restored.
   */
  onCloseAutoFocus?: (event: Event) => void;

  /**
   * Callback fired when the dialog/sheet opens and focus should be set.
   * Can be used to control which element receives focus on open.
   */
  onOpenAutoFocus?: (event: Event) => void;
}

/**
 * Type helper to ensure a component extends DialogOrSheetBaseProps.
 * Use this when defining your dialog/sheet component props.
 *
 * @example
 * ```tsx
 * interface MyDialogProps extends DialogOrSheetBaseProps {
 *   title?: string;
 *   data?: any;
 * }
 * ```
 */
export type DialogOrSheetComponent<T extends DialogOrSheetBaseProps = DialogOrSheetBaseProps> = React.ComponentType<T>;

/**
 * Type helper to extract custom props from a component that extends DialogOrSheetBaseProps.
 * This excludes only the required base props (open, onOpenChange) that are managed by the dialog manager.
 *
 * Optional base props (modal, onEscapeKeyDown, etc.) are NOT excluded, allowing you to pass them
 * when opening a dialog to customize behavior.
 *
 * Base props excluded:
 * - open (required, managed by dialog manager)
 * - onOpenChange (required, managed by dialog manager)
 *
 * Optional base props that CAN be passed:
 * - modal, onEscapeKeyDown, onPointerDownOutside, onInteractOutside, onFocusOutside,
 *   onCloseAutoFocus, onOpenAutoFocus
 */
export type DialogOrSheetCustomProps<T extends DialogOrSheetBaseProps> = Omit<T, "open" | "onOpenChange">;
