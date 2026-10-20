import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    return [
      {
        source: "/login",
        destination: "/",
        permanent: true,
      },
      {
        source: "/admin",
        destination: "/admin/dashboard",
        permanent: true,
      },
      {
        source: "/admin/create",
        destination: "/admin/exams/create",
        permanent: true,
      },
      {
        source: "/admin/grading",
        destination: "/admin/submissions",
        permanent: true,
      },
      {
        source: "/exam-result/:result_id",
        destination: "/history/:result_id",
        permanent: true,
      },
      {
        source: "/review/:result_id",
        destination: "/history/:result_id",
        permanent: true,
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
