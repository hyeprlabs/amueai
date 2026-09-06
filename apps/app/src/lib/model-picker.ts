/**
 * Picker sentinel for "let the app pick" - never a real Gateway model id, so
 * it's never sent to streamText directly. Lives in its own module (no
 * "server-only" import) because model-switcher.tsx, a client component,
 * needs the runtime value: importing it from gateway-models.ts instead would
 * pull that whole server-only module (and its `ai` gateway import) into the
 * client bundle and fail the build.
 */
export const AUTO_MODEL_ID = "auto";
