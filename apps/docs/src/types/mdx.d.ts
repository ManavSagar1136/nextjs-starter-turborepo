/**
 * MDX type definitions for TypeScript support
 */

declare module "*.mdx" {
  import type { ComponentType } from "react";

  interface MDXProps {
    [key: string]: unknown;
  }

  const MDXComponent: ComponentType<MDXProps>;
  export default MDXComponent;
}

declare module "@mdx-js/react" {
  import type { ComponentType, HTMLAttributes } from "react";

  export interface MDXComponents {
    [key: string]: ComponentType<HTMLAttributes<HTMLElement>>;
  }

  export function useMDXComponents(components?: MDXComponents): MDXComponents;
}
