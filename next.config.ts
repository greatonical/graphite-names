import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  /* 1️⃣  Keep a server so API routes work, but
        package only what the server needs.          */
  output: "standalone", // bundles a stripped-down Node app :contentReference[oaicite:0]{index=0}

  /* 2️⃣  Shut off heavyweight subsystems.           */
  images: { unoptimized: true }, // skip Image optimizer
  productionBrowserSourceMaps: false, // drop *.map files (RAM + build time)
  eslint: { ignoreDuringBuilds: true }, // CI will lint instead
  typescript: { ignoreBuildErrors: true }, // separate type check step

  /* 3️⃣  Enable the memory-reduction flags.         */
  experimental: {
    preloadEntriesOnStart: false, // don’t warm-up every route bundle :contentReference[oaicite:1]{index=1}
    webpackBuildWorker: true, // isolate big compiles in a worker :contentReference[oaicite:2]{index=2}
    webpackMemoryOptimizations: true, // shrink caches + more aggressive GC :contentReference[oaicite:3]{index=3}
  },
};

export default nextConfig;
