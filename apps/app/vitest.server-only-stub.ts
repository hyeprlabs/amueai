// vitest alias target for "server-only" — vite's client-oriented module
// resolution picks up server-only's browser-throwing stub even under
// `environment: "node"`. Tests run genuinely server-side, so this is a no-op.
export {};
