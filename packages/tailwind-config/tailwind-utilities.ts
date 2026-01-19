import plugin from "tailwindcss/plugin";

const customUtilities = plugin(({ addUtilities, matchUtilities, theme, addBase, addVariant }) => {
  // Get breakpoints from theme
  const screens = theme("screens") as Record<string, string>;

  // Custom container configuration
  // You can customize these values for each breakpoint
  const containerConfig = {
    // Default (mobile-first)
    default: {
      padding: "1rem", // 16px
      maxWidth: "100%",
    },
    // Small screens (sm: 640px)
    sm: {
      padding: "1.5rem", // 24px
      maxWidth: "640px",
    },
    // Medium screens (md: 768px)
    md: {
      padding: "2rem", // 32px
      maxWidth: "768px",
    },
    // Large screens (lg: 1024px)
    lg: {
      padding: "2.5rem", // 40px
      maxWidth: "1024px",
    },
    // Extra large screens (xl: 1280px)
    xl: {
      padding: "3rem", // 48px
      maxWidth: "1280px",
    },
    // 2X Large screens (2xl: 1536px)
    "2xl": {
      padding: "4rem", // 64px
      maxWidth: "1536px",
    },
  };

  // Build CSS with @layer utilities and media queries
  // This is the most reliable way to add responsive utilities in Tailwind plugins
  const breakpointOrder = ["sm", "md", "lg", "xl", "2xl"];

  // Use CSS custom properties approach for responsive behavior
  // This allows us to override values at different breakpoints using addBase
  addBase({
    ":root": {
      "--custom-container-padding": containerConfig.default.padding,
      "--custom-container-max-width": containerConfig.default.maxWidth,
    },
  });

  // Add responsive CSS custom properties using addBase with media queries
  breakpointOrder.forEach(breakpoint => {
    const minWidth = screens[breakpoint];
    const config = containerConfig[breakpoint as keyof typeof containerConfig];
    if (config && minWidth) {
      addBase({
        [`@media (min-width: ${minWidth})`]: {
          ":root": {
            "--custom-container-padding": config.padding,
            "--custom-container-max-width": config.maxWidth,
          },
        },
      });
    }
  });

  // Add the utility class that uses CSS custom properties
  addUtilities({
    ".custom-container": {
      width: "100%",
      marginLeft: "auto",
      marginRight: "auto",
      paddingLeft: "var(--custom-container-padding)",
      paddingRight: "var(--custom-container-padding)",
      maxWidth: "var(--custom-container-max-width)",
    },
  });

  const newUtilities = {
    /* Disable scroll area + convert viewport to flex scrollable column */
    ".no-scroll-area": {
      "&[data-slot='scroll-area'], > [data-slot='scroll-area']": {
        display: "flex !important",
        flexDirection: "column !important",
        flex: "1 1 0% !important",
        overflow: "hidden !important",
      },

      "&[data-slot='scroll-area'] > [data-slot='scroll-area-viewport'],\n> [data-slot='scroll-area'] > [data-slot='scroll-area-viewport']":
        {
          display: "flex !important",
          flexDirection: "column !important",
          flex: "1 1 0% !important",
          overflow: "hidden !important",
          minWidth: "0 !important",
        },

      "&[data-slot='scroll-area'] > [data-slot='scroll-area-viewport'] > div,\n> [data-slot='scroll-area'] > [data-slot='scroll-area-viewport'] > div":
        {
          display: "flex !important",
          flexDirection: "column !important",
          flex: "1 1 0% !important",
          overflow: "hidden !important",
          minWidth: "0 !important",
        },
    },

    /* -------------------- Scroll Containers -------------------- */
    ".scroll-parent": {
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      flex: "1",
    },
    /* -------------------- Scrollbar Gutter -------------------- */
    ".scrollbar-gutter-stable": {
      scrollbarGutter: "stable",
    },
    ".scrollbar-gutter-auto": {
      scrollbarGutter: "auto",
    },

    /* -------------------- General -------------------- */
    ".flex-center": {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
  };

  // Add the svg-* utility
  matchUtilities(
    {
      svg: value => ({
        [`& svg`]: {
          width: value,
          height: value,
        },
      }),
    },
    {
      values: theme("spacing"),
      type: "length",
    }
  );

  // Add svg: variant for targeting SVG children with any utility
  // Usage: svg:size-4, svg:w-6, svg:h-6, svg:text-blue-500, etc.
  addVariant("svg", "& svg");

  addUtilities(newUtilities);
}) as ReturnType<typeof plugin>;

export default customUtilities;
