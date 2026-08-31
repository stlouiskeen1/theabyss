import type { NextConfig } from "next";

// IMAGING CONFIG
// --------------
// next/image only loads images from hosts listed here (remotePatterns)
// OR from files inside the project's own /public folder — local files need
// NO entry here.
//
// The stock photos are random picsum.photos images, so that host is allowed.
// If you host your own photos elsewhere (e.g. Cloudinary, an S3 bucket or a
// CMS), add that host following the pattern below:
//
//   {
//     protocol: "https",
//     hostname: "res.cloudinary.com",
//   },
//
// For your own image swaps, no changes are needed here — just drop files in
// public/images/ and set slots in lib/mock.ts (see IMAGE_MAP there).
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/seed/**",
        search: "",
      },
    ],
  },
};

export default nextConfig;