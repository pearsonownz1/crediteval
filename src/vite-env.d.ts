/// <reference types="vite/client" />

// Extend the Window interface to include Klaviyo's _learnq
declare global {
  interface Window {
    _learnq?: Array<[string, any] | [string, string, any]>; // Define _learnq as an array for push operations
  }
}

// Export {} to ensure this file is treated as a module
export {};
