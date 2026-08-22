import * as migration_20260822_084537_add_blog_faq from "./20260822_084537_add_blog_faq";

export const migrations = [
  {
    up: migration_20260822_084537_add_blog_faq.up,
    down: migration_20260822_084537_add_blog_faq.down,
    name: "20260822_084537_add_blog_faq",
  },
];
