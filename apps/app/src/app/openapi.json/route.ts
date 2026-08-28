import { openApiDocument } from "@/lib/openapi";

export const revalidate = 3600;

export function GET(): Response {
  return Response.json(openApiDocument());
}
