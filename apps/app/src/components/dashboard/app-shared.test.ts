import { describe, expect, it } from "vitest";

import {
  findActiveNavItem,
  getActiveAgentId,
  getAgentNavGroups,
  headerPageTitle,
  isNavItemActive,
} from "./app-shared";

describe("isNavItemActive", () => {
  it("matches the exact route", () => {
    expect(isNavItemActive("/agents", "/agents")).toBe(true);
  });

  it("matches a nested route under the item's path", () => {
    expect(isNavItemActive("/agents", "/agents/abc-123/analytics")).toBe(true);
  });

  it("does not match a sibling route that merely shares a prefix", () => {
    expect(isNavItemActive("/agents", "/agents-archive")).toBe(false);
  });

  it("never matches a stub placeholder path", () => {
    expect(isNavItemActive("#/team", "#/team")).toBe(false);
  });

  it("returns false when the item has no path", () => {
    expect(isNavItemActive(undefined, "/agents")).toBe(false);
  });
});

describe("findActiveNavItem", () => {
  it("finds the Agents nav item for the list page", () => {
    expect(findActiveNavItem("/agents")?.title).toBe("Agents");
  });

  it("finds the Agents nav item for a nested agent detail page", () => {
    expect(findActiveNavItem("/agents/abc-123")?.title).toBe("Agents");
  });

  it("finds Usage for its real route", () => {
    expect(findActiveNavItem("/usage")?.title).toBe("Usage");
  });

  it("returns undefined for a route with no matching nav item (e.g. /settings, never in the sidebar's primary face)", () => {
    expect(findActiveNavItem("/profile")).toBeUndefined();
    expect(findActiveNavItem("/settings")).toBeUndefined();
  });

  it("prefers the most specific match when multiple paths could apply", () => {
    // Regression guard: nothing today has an item at "/agents" *and* a
    // deeper nav entry under it, but findActiveNavItem sorts by path
    // length specifically so a future deeper item wins over a shallower
    // one instead of whichever happens to appear first in navLinks.
    expect(findActiveNavItem("/agents/abc-123")?.path).toBe("/agents");
  });
});

describe("getActiveAgentId", () => {
  it("extracts the id from an agent sub-page", () => {
    expect(getActiveAgentId("/agents/abc-123/playground")).toBe("abc-123");
    expect(getActiveAgentId("/agents/abc-123/build/sources")).toBe("abc-123");
  });

  it("extracts the id for the agent's own bare route", () => {
    expect(getActiveAgentId("/agents/abc-123")).toBe("abc-123");
  });

  it("returns undefined for the agents list itself", () => {
    expect(getActiveAgentId("/agents")).toBeUndefined();
  });

  it("returns undefined outside /agents entirely", () => {
    expect(getActiveAgentId("/usage")).toBeUndefined();
  });
});

describe("getAgentNavGroups", () => {
  it("builds a single flat group of the 5 agent tabs, scoped to the given agent", () => {
    const groups = getAgentNavGroups("abc-123");

    expect(groups).toHaveLength(1);
    expect(groups[0].items.map((item) => item.title)).toEqual([
      "Playground",
      "Build",
      "Analytics",
      "Channels",
      "Settings",
    ]);
    expect(groups[0].items.map((item) => item.path)).toEqual([
      "/agents/abc-123/playground",
      "/agents/abc-123/build",
      "/agents/abc-123/analytics",
      "/agents/abc-123/channels",
      "/agents/abc-123/settings",
    ]);
  });
});

describe("headerPageTitle", () => {
  it("uses the matched nav item when one exists", () => {
    expect(headerPageTitle("/agents")?.title).toBe("Agents");
  });

  it("falls back to a title derived from the URL for pages outside the sidebar nav", () => {
    expect(headerPageTitle("/profile")?.title).toBe("Profile");
  });

  it("never falls back to a stale hardcoded title like the old always-Overview bug", () => {
    expect(headerPageTitle("/agents")?.title).not.toBe("Overview");
    expect(headerPageTitle("/settings")?.title).not.toBe("Overview");
  });
});
