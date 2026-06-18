import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Mock framer-motion globally to avoid animation-related warnings/issues in JSDOM
vi.mock('framer-motion', () => {
  const motionMock = new Proxy({}, {
    get: (target, prop) => {
      return ({ children, ...props }) => {
        const domProps = { ...props };
        [
          'initial',
          'animate',
          'exit',
          'transition',
          'whileHover',
          'whileTap',
          'whileInView',
          'viewport',
          'variants',
        ].forEach(key => delete domProps[key]);
        const Component = prop;
        return React.createElement(Component, domProps, children);
      };
    }
  });
  return {
    AnimatePresence: ({ children }) => children,
    motion: motionMock
  };
});
