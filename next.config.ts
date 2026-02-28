import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Add this to fix the mobile/network warning
  serverExternalPackages: ["yahoo-finance2"],
  experimental: {
    // Remove allowedDevOrigins from here
  },
  // Place it here if your version supports it, or ignore the warning
  // as it's just a warning for now.
};

export default nextConfig;