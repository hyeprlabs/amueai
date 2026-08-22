import { createLoader, parseAsInteger, parseAsString } from "nuqs/server";

/** Query-param schema for `/blog` filters — shared between the server page and the client filter bar. */
export const blogSearchParams = {
  page: parseAsInteger.withDefault(1),
  category: parseAsString,
  tag: parseAsString,
};

export const loadBlogSearchParams = createLoader(blogSearchParams);
