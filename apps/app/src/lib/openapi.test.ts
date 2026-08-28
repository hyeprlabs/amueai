import { describe, expect, it } from "vitest";

import { openApiDocument } from "@/lib/openapi";

describe("openApiDocument", () => {
  const doc = openApiDocument();

  it("declares OpenAPI 3.1", () => {
    expect(doc.openapi).toBe("3.1.0");
  });

  it("gives every operation a unique operationId, a summary, and typed responses", () => {
    const operationIds = new Set<string>();

    for (const [pathKey, pathItem] of Object.entries(doc.paths)) {
      const operation = pathItem.get;
      expect(operation, `${pathKey} should define a GET operation`).toBeDefined();
      expect(operation.operationId, `${pathKey} operationId`).toBeTruthy();
      expect(operationIds.has(operation.operationId)).toBe(false);
      operationIds.add(operation.operationId);

      expect(operation.summary, `${pathKey} summary`).toBeTruthy();
      expect(Object.keys(operation.responses).length).toBeGreaterThan(0);
      expect(operation.responses["200"]).toBeDefined();
    }
  });

  it("declares every path parameter with a type", () => {
    for (const [pathKey, pathItem] of Object.entries(doc.paths)) {
      const parameters = "parameters" in pathItem.get ? (pathItem.get.parameters ?? []) : [];
      for (const param of parameters) {
        expect(param.schema?.type, `${pathKey} param "${param.name}" schema.type`).toBeTruthy();
      }
    }
  });

  it("resolves every $ref used in a response schema to a defined component", () => {
    const definedSchemas = new Set(Object.keys(doc.components.schemas));
    const refs = JSON.stringify(doc).match(/#\/components\/schemas\/(\w+)/g) ?? [];

    for (const ref of refs) {
      const name = ref.replace("#/components/schemas/", "");
      expect(definedSchemas.has(name), `$ref to undefined schema: ${name}`).toBe(true);
    }
  });

  it("includes the v1 content API paths", () => {
    expect(Object.keys(doc.paths)).toEqual(
      expect.arrayContaining([
        "/api/v1",
        "/api/v1/posts",
        "/api/v1/posts/{slug}",
        "/api/v1/changelog",
        "/api/v1/competitors",
        "/api/v1/competitors/{slug}",
        "/api/v1/legal-pages",
        "/api/v1/legal-pages/{slug}",
      ]),
    );
  });
});
