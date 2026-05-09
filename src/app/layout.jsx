import "./globals.css";
import { Suspense } from "react";

export const metadata = {
  title: "Outpost · Multi-location operations, simplified",
  description:
    "Outpost is the operations platform for companies that run multiple locations — inspections, tasks, document collection, and recurring reporting. A Hypeify product.",
  applicationName: "Outpost",
  themeColor: "#1c1917",
  viewport:
    "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

// Root layout. Anything that needs to live above route groups (fonts,
// global providers that don't depend on tenant) goes here.
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,500&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Suspense fallback={null}>{children}</Suspense>
      </body>
    </html>
  );
}
