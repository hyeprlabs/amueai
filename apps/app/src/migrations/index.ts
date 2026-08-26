import * as migration_20260101_000000_init from "./20260101_000000_init";
import * as migration_20260822_084537_add_blog_faq from "./20260822_084537_add_blog_faq";
import * as migration_20260826_124420_add_changelog from "./20260826_124420_add_changelog";
import * as migration_20260826_141631_add_competitors from "./20260826_141631_add_competitors";
import * as migration_20260826_165700_strip_meta_title_suffix from "./20260826_165700_strip_meta_title_suffix";
import * as migration_20260826_172000_rework_competitor_comparison from "./20260826_172000_rework_competitor_comparison";

export const migrations = [
  {
    up: migration_20260101_000000_init.up,
    down: migration_20260101_000000_init.down,
    name: "20260101_000000_init",
  },
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
  {
    up: migration_20260826_141631_add_competitors.up,
    down: migration_20260826_141631_add_competitors.down,
    name: "20260826_141631_add_competitors",
  },
  {
    up: migration_20260826_165700_strip_meta_title_suffix.up,
    down: migration_20260826_165700_strip_meta_title_suffix.down,
    name: "20260826_165700_strip_meta_title_suffix",
  },
  {
    up: migration_20260826_172000_rework_competitor_comparison.up,
    down: migration_20260826_172000_rework_competitor_comparison.down,
    name: "20260826_172000_rework_competitor_comparison",
  },
];
