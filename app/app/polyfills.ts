// This file MUST be imported before any other imports that use Buffer.
// It ensures the Buffer polyfill is available globally in the browser.
import { Buffer } from 'buffer';

// Make Buffer available globally
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
}
if (typeof globalThis !== 'undefined') {
  (globalThis as any).Buffer = Buffer;
}
