import type { Access } from "payload";

/** Anyone can read published documents; logged-in admin users also see drafts. */
export const readPublishedOrLoggedIn: Access = ({ req }) => {
  if (req.user) return true;
  return { _status: { equals: "published" } };
};
