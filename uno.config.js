const { defineConfig } = require('unocss')
const presetMpx = require('@mpxjs/unocss-base')

// 典雅中国风绿色主题色
const themeColors = {
  // 主色调 - 竹青
  primary: {
    50: '#f0f7f4',
    100: '#dcede6',
    200: '#bbdccf',
    300: '#8ec3b3',
    400: '#5fa594',
    500: '#3d8b7a',
    600: '#2d6f61',
    700: '#255a4f',
    800: '#204842',
    900: '#1c3d37',
  },
  // 辅助色 - 墨绿
  secondary: {
    50: '#f2f7f5',
    100: '#dfece4',
    200: '#c3dbcb',
    300: '#9bc2aa',
    400: '#729f84',
    500: '#528168',
    600: '#3e6651',
    700: '#335242',
    800: '#2b4137',
    900: '#24362f',
  },
  // 点缀色 - 朱砂
  accent: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  // 中性色
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
}

module.exports = defineConfig({
  include: [/\.mpx($|\?)/],
  presets: [
    presetMpx()
  ],
  theme: {
    colors: themeColors,
    extend: {
      // 自定义间距
      spacing: {
        'safe-top': 'var(--safe-top, 0px)',
        'safe-bottom': 'var(--safe-bottom, 0px)',
      },
      // 圆角
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      // 阴影
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.1)',
        'float': '0 8px 24px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  shortcuts: [
    // 常用样式组合
    ['btn-primary', 'bg-primary-500 text-white rounded-xl px-4 py-3 font-medium active:bg-primary-600 transition-colors'],
    ['btn-secondary', 'bg-primary-50 text-primary-600 rounded-xl px-4 py-3 font-medium active:bg-primary-100 transition-colors'],
    ['card', 'bg-white rounded-2xl shadow-card p-4'],
    ['card-hover', 'hover:shadow-card-hover transition-shadow duration-200'],
    ['page-container', 'min-h-screen bg-gray-50 px-4 py-4'],
    ['text-title', 'text-gray-900 font-semibold text-lg'],
    ['text-body', 'text-gray-600 text-sm leading-relaxed'],
    ['text-caption', 'text-gray-400 text-xs'],
    ['status-processing', 'text-amber-500 bg-amber-50 px-2 py-1 rounded-full text-xs font-medium'],
    ['status-completed', 'text-primary-600 bg-primary-50 px-2 py-1 rounded-full text-xs font-medium'],
    ['status-failed', 'text-red-500 bg-red-50 px-2 py-1 rounded-full text-xs font-medium'],
  ],
  rules: [
    // 自定义规则
  ],
})
