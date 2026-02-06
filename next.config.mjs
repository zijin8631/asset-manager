import withPWA from 'next-pwa';

const nextConfig = {
  // 允许外部访问
  experimental: {
    serverComponentsExternalPackages: [],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: false, // 在开发环境也启用 PWA 以便测试
  scope: '/',
  runtimeCaching: [
    // 缓存图片资源
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico|webp)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30天
        },
      },
    },
    // 缓存JavaScript和CSS文件
    {
      urlPattern: /\.(?:js|css)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7天
        },
      },
    },
    // 缓存字体文件
    {
      urlPattern: /\.(?:woff|woff2|ttf|eot|otf)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'fonts-cache',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1年
        },
      },
    },
    // 缓存页面路由（HTML、Next.js页面）
    {
      urlPattern: /^https?:\/\/[^/]+\/(?!api\/)(?:[^?#]*)?$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages-cache',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 24 * 60 * 60, // 24小时
        },
        networkTimeoutSeconds: 3, // 3秒后回退到缓存
      },
    },
    // 缓存API请求
    {
      urlPattern: /^https?:\/\/[^/]+\/api\/.*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5分钟
        },
        networkTimeoutSeconds: 3,
      },
    },
    // 缓存其他静态资源（JSON、XML等）
    {
      urlPattern: /\.(?:json|xml|txt|md)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'data-cache',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7天
        },
      },
    },
  ],
})(nextConfig);