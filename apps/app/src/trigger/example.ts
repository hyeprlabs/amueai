import { logger, task } from "@trigger.dev/sdk";

export const exampleTask = task({
  id: "example",
  run: async (payload: { message: string }) => {
    logger.log("Example task received a payload", { payload });
    return { received: payload.message };
  },
});
