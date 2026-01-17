"use client";

/**
 * Hook to check if user is logged in
 * For the public app, this is a simplified version that always returns false
 * since the public app doesn't handle authentication directly.
 * Users are redirected to the user app for authentication.
 */
export const useIsLogged = () => {
  // Public app doesn't handle authentication
  // Users are redirected to the user app for login/signup
  return {
    isLoading: false,
    isLogged: false,
    user: null,
    isAdmin: false,
  };
};
