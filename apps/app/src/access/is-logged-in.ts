import type { Access } from "payload";

/** Requires an authenticated admin user. Used to lock down mutations on public-facing collections. */
export const isLoggedIn: Access = ({ req }) => Boolean(req.user);
