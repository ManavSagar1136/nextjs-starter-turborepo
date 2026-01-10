// /**
//  * Example usage of SaaSProvider
//  *
//  * This file demonstrates how to use the SaaSProvider in your app.
//  * Copy and adapt this code to your app's layout or root component.
//  */

// import React from "react";
// import { SaaSProvider } from "@buildbase/saas-sdk";

// export default function RootLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <html lang="en">
//       <body>
//         <SaaSProvider
//           redirectUrl="/auth/callback"
//           onSignOut={async () => {
//             try {
//               // await API.auth.logout();
//             } catch (error) {
//               console.error("Error during logout:", error);
//             }
//             window.location.reload();
//           }}
//           handleAuthentication={async (code: string) => {
//             try {
//               const data = { success: true, sessionId: "123", message: "Authentication successful" }; //await API.auth.verify(code);
//               if (data.success && data.sessionId) {
//                 return { sessionId: data.sessionId };
//               } else {
//                 throw new Error(data.message || "Authentication failed");
//               }
//             } catch (error) {
//               const errorMessage = error instanceof Error ? error.message : "Authentication failed";
//               throw new Error(errorMessage);
//             }
//           }}
//           handleEvent={(eventType: string, data: any) => {
//             // Handle workspace events
//             if (
//               eventType === "workspace:changed" ||
//               eventType === "workspace:created" ||
//               eventType === "workspace:updated" ||
//               eventType === "workspace:deleted" ||
//               eventType === "workspace:user-added" ||
//               eventType === "workspace:user-removed" ||
//               eventType === "workspace:user-role-changed"
//             ) {
//               // Extract and prepare payload based on event type and handle it in your app
//             }
//           }}
//         >
//           {children}
//         </SaaSProvider>
//       </body>
//     </html>
//   );
// }
