import { useMDXComponents as getThemeComponents } from "nextra-theme-docs";

// Get the default MDX components from Nextra theme
const themeComponents = getThemeComponents();

// Export useMDXComponents function for Nextra to use as MDX import source
// This file should be at the root level (same level as app/ directory)
export function useMDXComponents(components: any = {}) {
  return {
    ...themeComponents,
    ...components,
  };
}
