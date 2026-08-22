import type { CollectionConfig } from "payload";

import { isLoggedIn } from "@/access/is-logged-in";

export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    useAsTitle: "email",
  },
  auth: true,
  // Only an already-authenticated admin can list, invite, edit, or remove users.
  // A user already exists in this project, so this can't lock out onboarding —
  // new admins are added by an existing admin, not via public self-registration.
  access: {
    create: isLoggedIn,
    read: isLoggedIn,
    update: isLoggedIn,
    delete: isLoggedIn,
  },
  fields: [
    // Email added by default
    // Add more fields as needed
  ],
};
