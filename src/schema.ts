import { z } from 'astro/zod';

/**
 * Fields are a subset of those present in the Goodreads RSS feed.
 */
export const BookSchema = z.object({
    id: z.coerce.string(),
    title: z.coerce.string(),
    date_read: z.string(),
    rating: z.number(),
    author_name: z.string(),
    book_image_url: z.string(),
  });
export type Book = z.infer<typeof BookSchema>;