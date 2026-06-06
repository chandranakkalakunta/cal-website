import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title:    z.string(),
    tagline:  z.string(),
    status:   z.string(),
    featured: z.boolean().default(false),
    draft:    z.boolean().default(false),
    order:    z.number().optional(),

    problem: z.string(),

    pillars: z.object({
      iac:         z.string(),
      security:    z.string(),
      performance: z.string(),
      innovation:  z.string(),
    }),

    architectureNote:    z.string().optional(),
    architectureDiagram: z.string().optional(),

    outcome: z.string(),
    stack:   z.array(z.string()),

    links: z
      .object({
        github: z.string().optional(),
        live:   z.string().optional(),
      })
      .optional(),
  }),
});

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title:     z.string(),
    date:      z.coerce.date(),
    summary:   z.string(),
    tags:      z.array(z.string()),
    heroImage: z.string().optional(),
  }),
});

export const collections = { projects, articles };
