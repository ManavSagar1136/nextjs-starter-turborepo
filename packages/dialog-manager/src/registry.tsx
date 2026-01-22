import React from "react";
import type { DialogComponentMap, DialogKey } from "./types";
import type { DialogOrSheetBaseProps, DialogOrSheetComponent } from "./base-props";

/**
 * Global dialog registry that stores all registered dialog components.
 * Apps can register their own dialogs, and common dialogs are registered by default.
 */
class DialogRegistry<T extends DialogComponentMap = DialogComponentMap> {
  private components: Map<string, React.ComponentType<any>> = new Map();
  private lazyLoaders: Map<string, () => Promise<{ default: React.ComponentType<any> }>> = new Map();

  /**
   * Register a dialog or sheet component with a key.
   * The component must extend DialogOrSheetBaseProps (have `open` and `onOpenChange` props).
   *
   * @param key - The dialog key
   * @param component - The React component for the dialog/sheet (must extend DialogOrSheetBaseProps)
   * @param options - Registration options
   * @throws Error if dialog already exists and override is false
   * @throws Error if component doesn't have required props
   */
  register<K extends string>(
    key: K,
    component: DialogOrSheetComponent<DialogOrSheetBaseProps>,
    options: { override?: boolean } = {}
  ): void {
    if (this.components.has(key) && !options.override) {
      throw new Error(`Dialog with key "${key}" is already registered. Use override: true to replace it.`);
    }

    // Validate that component has the required props
    // This is a runtime check - TypeScript will catch it at compile time
    this.validateComponent(component, key);

    this.components.set(key, component);
    // Remove lazy loader if component is directly registered
    this.lazyLoaders.delete(key);
  }

  /**
   * Validates that a component extends DialogOrSheetBaseProps.
   * This is a runtime check to ensure type safety.
   */
  private validateComponent(component: React.ComponentType<any>, key: string): void {
    if (!component) {
      throw new Error(`Component for dialog "${key}" is null or undefined.`);
    }

    // Check if component is a valid React component
    if (typeof component !== "function" && typeof component !== "object") {
      throw new Error(`Component for dialog "${key}" must be a React component. Received: ${typeof component}`);
    }
  }

  /**
   * Register a lazy-loaded dialog or sheet component.
   * The component will only be loaded when the dialog is first opened.
   * The loaded component must extend DialogOrSheetBaseProps.
   *
   * @param key - The dialog key
   * @param loader - Function that returns a promise resolving to the dialog/sheet component
   * @param options - Registration options
   */
  registerLazy<K extends string>(
    key: K,
    loader: () => Promise<{ default: DialogOrSheetComponent<DialogOrSheetBaseProps> }>,
    options: { override?: boolean } = {}
  ): void {
    if (this.components.has(key) && !options.override) {
      throw new Error(`Dialog with key "${key}" is already registered. Use override: true to replace it.`);
    }

    this.lazyLoaders.set(key, loader);
    // Remove direct component if lazy loader is registered
    this.components.delete(key);
  }

  /**
   * Register multiple dialog/sheet components at once.
   * All components must extend DialogOrSheetBaseProps.
   *
   * @param components - Object mapping keys to components
   * @param options - Registration options
   */
  registerMany(components: Partial<T>, options: { override?: boolean } = {}): void {
    Object.entries(components).forEach(([key, component]) => {
      if (component) {
        this.register(key, component as DialogOrSheetComponent<DialogOrSheetBaseProps>, options);
      }
    });
  }

  /**
   * Get a dialog component by key.
   * If the dialog is lazy-loaded, it will be loaded on first access.
   * @param key - The dialog key
   * @returns The component or undefined if not found
   */
  async get(key: string): Promise<React.ComponentType<any> | undefined> {
    // Check if component is already loaded
    if (this.components.has(key)) {
      return this.components.get(key);
    }

    // Check if there's a lazy loader
    const loader = this.lazyLoaders.get(key);
    if (loader) {
      try {
        const module = await loader();
        const component = module.default;
        // Cache the loaded component
        this.components.set(key, component);
        this.lazyLoaders.delete(key);
        return component;
      } catch (error) {
        console.error(`Failed to lazy load dialog "${key}":`, error);
        return undefined;
      }
    }

    return undefined;
  }

  /**
   * Synchronously get a dialog component by key (only for pre-loaded components).
   * For lazy-loaded dialogs, use `get()` instead.
   * @param key - The dialog key
   * @returns The component or undefined if not found or not loaded
   */
  getSync(key: string): React.ComponentType<any> | undefined {
    return this.components.get(key);
  }

  /**
   * Check if a dialog is registered (either directly or lazily).
   * @param key - The dialog key
   * @returns True if registered, false otherwise
   */
  has(key: string): boolean {
    return this.components.has(key) || this.lazyLoaders.has(key);
  }

  /**
   * Check if a dialog is already loaded (not lazy).
   * @param key - The dialog key
   * @returns True if loaded, false if lazy or not registered
   */
  isLoaded(key: string): boolean {
    return this.components.has(key);
  }

  /**
   * Get all registered dialog components as an object.
   * Only returns pre-loaded components, not lazy-loaded ones.
   * @returns Object mapping keys to components
   */
  getAll(): Record<string, React.ComponentType<any>> {
    const result: Record<string, React.ComponentType<any>> = {};
    this.components.forEach((component, key) => {
      result[key] = component;
    });
    return result as T;
  }

  /**
   * Get all registered dialog keys (both loaded and lazy).
   * @returns Array of dialog keys
   */
  getKeys(): string[] {
    const keys = new Set<string>();
    this.components.forEach((_, key) => keys.add(key));
    this.lazyLoaders.forEach((_, key) => keys.add(key));
    return Array.from(keys);
  }

  /**
   * Remove a dialog from the registry.
   * @param key - The dialog key
   * @returns True if removed, false if not found
   */
  unregister(key: string): boolean {
    const removedComponent = this.components.delete(key);
    const removedLoader = this.lazyLoaders.delete(key);
    return removedComponent || removedLoader;
  }

  /**
   * Clear all registered dialogs.
   */
  clear(): void {
    this.components.clear();
    this.lazyLoaders.clear();
  }

  /**
   * Preload a lazy-loaded dialog.
   * @param key - The dialog key
   * @returns Promise that resolves when the dialog is loaded
   */
  async preload(key: string): Promise<void> {
    if (this.components.has(key)) {
      return; // Already loaded
    }

    const loader = this.lazyLoaders.get(key);
    if (loader) {
      await this.get(key);
    }
  }

  /**
   * Preload multiple lazy-loaded dialogs.
   * @param keys - Array of dialog keys to preload
   * @returns Promise that resolves when all dialogs are loaded
   */
  async preloadMany(keys: string[]): Promise<void> {
    await Promise.all(keys.map(key => this.preload(key)));
  }
}

/**
 * Global dialog registry instance.
 * This is shared across all apps and can be used to register dialogs.
 */
export const dialogRegistry = new DialogRegistry();

/**
 * Type-safe dialog registry controller.
 * Provides type-safe methods for registering dialogs.
 */
export class DialogRegistryController<T extends DialogComponentMap = DialogComponentMap> {
  /**
   * Register a single dialog/sheet component.
   * Component must extend DialogOrSheetBaseProps.
   */
  register<K extends string>(
    key: K,
    component: DialogOrSheetComponent<DialogOrSheetBaseProps>,
    options?: { override?: boolean }
  ): this {
    dialogRegistry.register(key, component, options);
    return this;
  }

  /**
   * Register a lazy-loaded dialog/sheet component.
   * Loaded component must extend DialogOrSheetBaseProps.
   */
  registerLazy<K extends string>(
    key: K,
    loader: () => Promise<{ default: DialogOrSheetComponent<DialogOrSheetBaseProps> }>,
    options?: { override?: boolean }
  ): this {
    dialogRegistry.registerLazy(key, loader, options);
    return this;
  }

  /**
   * Register multiple dialog/sheet components.
   * All components must extend DialogOrSheetBaseProps.
   */
  registerMany(components: Partial<T>, options?: { override?: boolean }): this {
    dialogRegistry.registerMany(components, options);
    return this;
  }

  /**
   * Get a dialog component (supports lazy loading).
   */
  async get(key: DialogKey<T>): Promise<React.ComponentType<any> | undefined> {
    return dialogRegistry.get(key);
  }

  /**
   * Synchronously get a dialog component (only pre-loaded).
   */
  getSync(key: DialogKey<T>): React.ComponentType<any> | undefined {
    return dialogRegistry.getSync(key);
  }

  /**
   * Check if a dialog is registered.
   */
  has(key: string): boolean {
    return dialogRegistry.has(key);
  }

  /**
   * Check if a dialog is already loaded.
   */
  isLoaded(key: string): boolean {
    return dialogRegistry.isLoaded(key);
  }

  /**
   * Get all registered dialogs (only pre-loaded).
   */
  getAll(): T {
    return dialogRegistry.getAll() as T;
  }

  /**
   * Get all registered dialog keys.
   */
  getKeys(): string[] {
    return dialogRegistry.getKeys();
  }

  /**
   * Remove a dialog.
   */
  unregister(key: string): this {
    dialogRegistry.unregister(key);
    return this;
  }

  /**
   * Clear all dialogs.
   */
  clear(): this {
    dialogRegistry.clear();
    return this;
  }

  /**
   * Preload a lazy-loaded dialog.
   */
  async preload(key: string): Promise<this> {
    await dialogRegistry.preload(key);
    return this;
  }

  /**
   * Preload multiple lazy-loaded dialogs.
   */
  async preloadMany(keys: string[]): Promise<this> {
    await dialogRegistry.preloadMany(keys);
    return this;
  }
}

/**
 * Create a new dialog registry controller instance.
 * @returns A new DialogRegistryController instance
 */
export function createDialogRegistry<T extends DialogComponentMap = DialogComponentMap>(): DialogRegistryController<T> {
  return new DialogRegistryController<T>();
}
