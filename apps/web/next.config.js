//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  // Use this to set Nx-specific options
  // See: https://nx.dev/recipes/next/next-config-setup
  nx: {},

  // Las libs del workspace (p.ej. @org/contracts) se consumen como source y usan
  // imports con extensión .js (estilo nodenext). Next debe transpilarlas y mapear
  // .js -> .ts al resolver.
  transpilePackages: ['@org/contracts'],

  // Turbopack (dev): permite resolver imports .js a sus fuentes .ts.
  turbopack: {
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.mjs'],
  },

  // Webpack (build): mapea las extensiones .js/.mjs/.cjs a sus equivalentes TS.
  webpack: (/** @type {import('webpack').Configuration} */ config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
      '.cjs': ['.cts', '.cjs'],
    };
    return config;
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
