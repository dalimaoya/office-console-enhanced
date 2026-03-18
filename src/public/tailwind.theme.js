/**
 * Tailwind Theme Config — 办公增强控制台
 * P1 CC 借鉴设计 Token 对应 Tailwind 扩展配置
 * Author: ui-lux  |  2026-03-19
 *
 * 使用方式：
 *   在 tailwind.config.js 中导入并 spread 到 theme.extend:
 *   const officeTheme = require('./tailwind.theme.js');
 *   module.exports = { theme: { extend: officeTheme } }
 */

const officeTheme = {

  // ─── 颜色系统（7 色语义 + 调色板）─────────────────────────────────────────
  colors: {
    // 7 色语义主色（与 tokens.css --palette-* 对齐）
    green: {
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',   // semantic-success
      600: '#16a34a',
      700: '#15803d',
    },
    yellow: {
      300: '#fde047',
      400: '#facc15',
      500: '#eab308',   // semantic-warning
      600: '#ca8a04',
    },
    orange: {
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',   // semantic-attention
      600: '#ea580c',
    },
    red: {
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',   // semantic-error
      600: '#dc2626',
    },
    gray: {
      300: '#d1d5db',
      400: '#9ca3af',   // semantic-neutral
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
    },
    blue: {
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',   // semantic-info
      600: '#2563eb',
      700: '#1d4ed8',
    },
    violet: {
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6',   // semantic-brand
      600: '#7c3aed',
      700: '#6d28d9',
    },

    // 应用专属调色板（深海军蓝暗色主题）
    navy: {
      950: '#070c18',
      900: '#0a1020',
      800: '#0d1629',
      700: '#111e38',
      600: '#152240',
      500: '#1a2a4e',
    },

    // 语义色别名（用于 bg-*/text-*/border-* 工具类）
    semantic: {
      success:    '#22c55e',
      warning:    '#eab308',
      attention:  '#f97316',
      danger:     '#ef4444',
      neutral:    '#9ca3af',
      info:       '#3b82f6',
      brand:      '#8b5cf6',
    },

    // 品牌主色
    primary:  '#5b96ff',
  },

  // ─── 圆角（对齐 tokens.css --radii-* / --radius-*）──────────────────────────
  borderRadius: {
    'none': '0',
    'xs':   '3px',
    'sm':   '5px',
    DEFAULT:'8px',
    'md':   '8px',
    'lg':   '12px',
    'xl':   '16px',
    '2xl':  '20px',
    'pill': '9999px',
    'full': '9999px',
  },

  // ─── 间距（对齐 tokens.css --spacing-* / --space-*）─────────────────────────
  spacing: {
    '0':  '0',
    '1':  '4px',
    '2':  '8px',
    '3':  '12px',
    '4':  '16px',
    '5':  '20px',
    '6':  '24px',
    '7':  '32px',
    '8':  '40px',
    '9':  '48px',
    '10': '64px',
    // 语义别名
    'xs':  '4px',
    'sm':  '8px',
    'md':  '16px',
    'lg':  '24px',
    'xl':  '32px',
    '2xl': '48px',
    '3xl': '64px',
  },

  // ─── 字号（对齐 tokens.css --text-*）────────────────────────────────────────
  fontSize: {
    'xs':   ['11px', { lineHeight: '1.5' }],
    'sm':   ['12px', { lineHeight: '1.5' }],
    'base': ['14px', { lineHeight: '1.55' }],
    'md':   ['16px', { lineHeight: '1.5' }],
    'lg':   ['18px', { lineHeight: '1.4' }],
    'xl':   ['20px', { lineHeight: '1.35' }],
    '2xl':  ['24px', { lineHeight: '1.25' }],
    '3xl':  ['32px', { lineHeight: '1.1' }],
  },

  // ─── 字重────────────────────────────────────────────────────────────────────
  fontWeight: {
    normal:    '400',
    medium:    '500',
    semibold:  '600',
    bold:      '700',
    extrabold: '800',
  },

  // ─── 投影（对齐 tokens.css --shadow-*）──────────────────────────────────────
  boxShadow: {
    'xs':  '0 1px 2px rgba(0,0,0,0.2)',
    'sm':  '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
    DEFAULT: '0 4px 12px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.2)',
    'md':  '0 4px 12px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.2)',
    'lg':  '0 8px 24px rgba(0,0,0,0.4),  0 4px 8px rgba(0,0,0,0.25)',
    'xl':  '0 20px 48px rgba(0,0,0,0.5)',
    '2xl': '0 32px 64px rgba(0,0,0,0.6)',
    // 彩色辉光
    'glow-primary': '0 0 20px rgba(91,150,255,0.2)',
    'glow-success': '0 0 16px rgba(34,197,94,0.2)',
    'glow-warning': '0 0 16px rgba(234,179,8,0.2)',
    'glow-danger':  '0 0 16px rgba(239,68,68,0.2)',
    'glow-brand':   '0 0 20px rgba(139,92,246,0.2)',
    'none': 'none',
  },

  // ─── 动效时长（对齐 tokens.css --dur-*）─────────────────────────────────────
  transitionDuration: {
    'instant': '80ms',
    'fast':    '120ms',
    DEFAULT:   '200ms',
    'base':    '200ms',
    'slow':    '320ms',
    'slower':  '480ms',
  },

  // ─── 缓动函数（对齐 tokens.css --ease-*）────────────────────────────────────
  transitionTimingFunction: {
    'in':     'cubic-bezier(0.64, 0, 0.78, 0)',
    'out':    'cubic-bezier(0.22, 1, 0.36, 1)',
    'in-out': 'cubic-bezier(0.37, 0, 0.63, 1)',
    'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // ─── 三栏布局宽度────────────────────────────────────────────────────────────
  width: {
    'sidebar':   '240px',
    'inspector': '256px',
  },

  maxWidth: {
    'content': '1440px',
    'narrow':  '840px',
  },

  // ─── Z-index 层级────────────────────────────────────────────────────────────
  zIndex: {
    'base':    '0',
    'raised':  '10',
    'sticky':  '50',
    'nav':     '100',
    'overlay': '200',
    'modal':   '300',
    'toast':   '400',
    'tooltip': '500',
    'max':     '9999',
  },
};

module.exports = officeTheme;
