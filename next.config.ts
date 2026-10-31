import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdfkit'],
  outputFileTracingIncludes: { '/api/report': ['./assets/report-fonts/**/*'] },
  allowedDevOrigins: ['10.34.7.193'],
};

export default nextConfig;
