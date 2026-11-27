import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const nowCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/now" }),
  schema: z.object({
    title: z.string(),
    updatedAt: z.coerce.date(),
    location: z.string(),
    status: z.string().default("ACTIVE"),
    focus: z.string(),
    gear: z.string().optional(),
  }),
});

export const collections = {
  now: nowCollection,
};
