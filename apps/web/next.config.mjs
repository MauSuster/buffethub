/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pacotes do monorepo são exportados como código-fonte TS; o Next os transpila.
  transpilePackages: [
    '@buffethub/domain',
    '@buffethub/utils',
    '@buffethub/validation',
    '@buffethub/database',
  ],
  // Lint é executado por `pnpm lint` (flat config na raiz), não durante o build.
  eslint: { ignoreDuringBuilds: true },
  // Erros de tipo continuam quebrando o build (gate forte).
  typescript: { ignoreBuildErrors: false },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }],
  },
  webpack: (config) => {
    // Os pacotes usam specifiers ESM com extensão .js apontando para arquivos .ts.
    // Ensina o webpack a resolver .js -> .ts/.tsx no monorepo.
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    };
    return config;
  },
};

export default nextConfig;
