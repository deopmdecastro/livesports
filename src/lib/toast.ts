"use client";

import toast from 'react-hot-toast';

/**
 * Unified toast helpers — consistent styling across the app.
 */
export const showToast = {
  success: (message: string) =>
    toast.success(message, {
      style: {
        background: '#0E2A0E',
        color: '#FFFFFF',
        border: '1px solid #1A4A1A',
      },
      iconTheme: { primary: '#22C55E', secondary: '#FFFFFF' },
    }),

  error: (message: string) =>
    toast.error(message, {
      style: {
        background: '#2A0E0E',
        color: '#FFFFFF',
        border: '1px solid #4A1A1A',
      },
      iconTheme: { primary: '#E50914', secondary: '#FFFFFF' },
    }),

  warning: (message: string) =>
    toast(message, {
      icon: '⚠️',
      style: {
        background: '#2A2A0E',
        color: '#FFFFFF',
        border: '1px solid #4A4A1A',
      },
    }),

  info: (message: string) =>
    toast(message, {
      icon: 'ℹ️',
      style: {
        background: '#111118',
        color: '#FFFFFF',
        border: '1px solid #1E1E2A',
      },
    }),
};
