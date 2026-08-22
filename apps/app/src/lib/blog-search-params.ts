import { createLoader, parseAsArrayOf, parseAsInteger, parseAsString } from "nuqs/server";

/** Query-param schema for `/blog` filters — shared between the server page and the client filter bar. */
export const blogSearchParams = {
  page: parseAsInteger.withDefault(1),
  category: parseAsString,
  tags: parseAsArrayOf(parseAsString).withDefault([]),
};

export const loadBlogSearchParams = createLoader(blogSearchParams);
