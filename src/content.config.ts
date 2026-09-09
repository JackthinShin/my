import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      title: z.string().max(120),
      description: z.string().max(200).optional(),
      date: z.coerce.date(),
      draft: z.boolean().default(false),
      tags: z.array(z.string()).default([]),
      category: z.string().default('Blog'),
      math: z.boolean().optional().default(false),
      image: image().optional(),
    }),
});

export const collections = { blog };
