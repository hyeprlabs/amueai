import * as migration_20260822_084537_add_blog_faq from "./20260822_084537_add_blog_faq";
import * as migration_20260826_124420_add_changelog from "./20260826_124420_add_changelog";

export const migrations = [
  {
    up: migration_20260822_084537_add_blog_faq.up,
    down: migration_20260822_084537_add_blog_faq.down,
    name: "20260822_084537_add_blog_faq",
  },
  {
    up: migration_20260826_124420_add_changelog.up,
    down: migration_20260826_124420_add_changelog.down,
    name: "20260826_124420_add_changelog",
  },
];
