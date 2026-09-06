import * as migration_20260101_000000_init from "./20260101_000000_init";
import * as migration_20260822_084537_add_blog_faq from "./20260822_084537_add_blog_faq";
import * as migration_20260826_124420_add_changelog from "./20260826_124420_add_changelog";
import * as migration_20260826_141631_add_competitors from "./20260826_141631_add_competitors";
import * as migration_20260826_165700_strip_meta_title_suffix from "./20260826_165700_strip_meta_title_suffix";
import * as migration_20260826_172000_rework_competitor_comparison from "./20260826_172000_rework_competitor_comparison";
import * as migration_20260826_180000_simplify_competitors from "./20260826_180000_simplify_competitors";
import * as migration_20260826_185000_rename_comparison_feature_to_label from "./20260826_185000_rename_comparison_feature_to_label";
import * as migration_20260901_211004_add_mcp_api_keys from "./20260901_211004_add_mcp_api_keys";
import * as migration_20260905_130000_add_mcp_api_key_create_columns from "./20260905_130000_add_mcp_api_key_create_columns";
import * as migration_20260905_215424_add_legal_pages_mcp_permission from "./20260905_215424_add_legal_pages_mcp_permission";

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
  {
    up: migration_20260826_180000_simplify_competitors.up,
    down: migration_20260826_180000_simplify_competitors.down,
    name: "20260826_180000_simplify_competitors",
  },
  {
    up: migration_20260826_185000_rename_comparison_feature_to_label.up,
    down: migration_20260826_185000_rename_comparison_feature_to_label.down,
    name: "20260826_185000_rename_comparison_feature_to_label",
  },
  {
    up: migration_20260901_211004_add_mcp_api_keys.up,
    down: migration_20260901_211004_add_mcp_api_keys.down,
    name: "20260901_211004_add_mcp_api_keys",
  },
  {
    up: migration_20260905_130000_add_mcp_api_key_create_columns.up,
    down: migration_20260905_130000_add_mcp_api_key_create_columns.down,
    name: "20260905_130000_add_mcp_api_key_create_columns",
  },
  {
    up: migration_20260905_215424_add_legal_pages_mcp_permission.up,
    down: migration_20260905_215424_add_legal_pages_mcp_permission.down,
    name: "20260905_215424_add_legal_pages_mcp_permission",
  },
];
