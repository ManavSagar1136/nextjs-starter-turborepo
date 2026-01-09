/**
 * Hook registry for managing and tracking hooks usage
 * This can be extended for debugging, analytics, or hook composition
 */

type HookMetadata = {
  name: string;
  version?: string;
  description?: string;
};

const hookRegistry = new Map<string, HookMetadata>();

export const registerHook = (
  name: string,
  metadata?: Omit<HookMetadata, "name">,
) => {
  hookRegistry.set(name, {
    name,
    ...metadata,
  });
};

export const getRegisteredHooks = (): HookMetadata[] => {
  return Array.from(hookRegistry.values());
};

export const isHookRegistered = (name: string): boolean => {
  return hookRegistry.has(name);
};
