"use client";

// import { useQuery, useMutation, useQueryClient } from "@buildbase/tanstack-query";
// import { API } from "@/services";
// import { queryKeys } from "./query-keys";

// /**
//  * Query hook to get current authenticated user
//  */
// export const useCurrentUser = () => {
//   return useQuery({
//     queryKey: queryKeys.auth.user(),
//     queryFn: async () => {
//       // This would typically call an API endpoint to get current user
//       // For now, using the verify endpoint as an example
//       // You should create a dedicated endpoint like API.auth.getCurrentUser()
//       const response = await API.auth.verify("");
//       if (response.success && response.user) {
//         return response.user;
//       }
//       throw new Error("User not authenticated");
//     },
//     enabled: false, // Disable by default, enable when needed
//     staleTime: 5 * 60 * 1000, // 5 minutes
//   });
// };

/**
 * Mutation hook for user logout
 */
// export const useLogout = () => {
//   // const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async () => {
//       return API.auth.logout();
//     },
//     onSuccess: () => {
//       // // Invalidate all auth-related queries
//       // queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
//     },
//   });
// };
