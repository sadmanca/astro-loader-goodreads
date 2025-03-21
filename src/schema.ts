import { z } from 'astro/zod';

/**
 * Fields are present with the same names as in Goodreads RSS feeds.
 */
export const BookSchema = z.object({
  id: z.coerce.string(),
  title: z.coerce.string(),
  guid: z.string(),
  pubDate: z.string(),
  link: z.string(),
  book_id: z.coerce.string(),
  book_image_url: z.string(),
  book_small_image_url: z.string(),
  book_medium_image_url: z.string(),
  book_large_image_url: z.string(),
  book_description: z.string(),
  num_pages: z.string().optional(),
  author_name: z.string(),
  isbn: z.coerce.string(),
  user_name: z.string(),
  user_rating: z.number(),
  user_read_at: z.string(),
  user_date_added: z.string(),
  user_date_created: z.string(),
  user_shelves: z.string().optional(),
  user_review: z.string().optional(),
  average_rating: z.number(),
  book_published: z.coerce.string(),
});
export type Book = z.infer<typeof BookSchema>;

/**
 * Fields are present with the same names as in Goodreads author blog RSS feeds.
 */
export const AuthorBlogSchema = z.object({
  id: z.string(),
  title: z.string(),
  link: z.string(),
  description: z.string(),
  pubDate: z.string(),
  author: z.string().optional(),
  content: z.string().optional(),
});
export type AuthorBlog = z.infer<typeof AuthorBlogSchema>;

/**
 * Discriminated union for different types of user updates.
 */
const ItemDataSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('AuthorFollowing'),
    followId: z.string(),
    userUrl: z.string(),
    authorId: z.string()
  }),
  z.object({
    type: z.literal('UserStatus'),
    userUrl: z.string(),
    percentRead: z.string(),
    bookUrl: z.string(),
    bookTitle: z.string(),
    bookAuthor: z.string(),
    bookImgUrl: z.string()
  }),
  z.object({
    type: z.literal('ReadStatus'),
    userUrl: z.string(),
    readingStatus: z.string(),
    bookUrl: z.string(),
    bookTitle: z.string(),
    bookAuthor: z.string(),
    bookImgUrl: z.string()
  }),
  z.object({
    type: z.literal('Review'),
    userUrl: z.string(),
    rating: z.number(),
    bookUrl: z.string(),
    bookTitle: z.string(),
    bookAuthor: z.string(),
    bookImgUrl: z.string()
  }),
  z.object({
    type: z.literal('LikeReview'),
    userUrl: z.string(),
    reviewUrl: z.string(),
    reviewUser: z.string(),
    bookUrl: z.string(),
    bookTitle: z.string(),
    bookImgUrl: z.string()
  }),  
  z.object({
    type: z.literal('LikeReadStatus'),
    userUrl: z.string(),
    readStatusUser: z.string(),
    readStatusUserImgUrl: z.string(),
    readStatus: z.string(),
    bookUrl: z.string(),
    bookTitle: z.string(),
  }),  
  z.object({
    type: z.literal('CommentStatus'),
    userUrl: z.string(),
    statusUrl: z.string(),
    statusUser: z.string(),
    comment: z.string()
  }),
  z.object({
    type: z.literal('CommentReview'),
    userUrl: z.string(),
    reviewUrl: z.string(),
    reviewUser: z.string(),
    bookUrl: z.string(),
    bookTitle: z.string(),
    bookAuthor: z.string(),
    comment: z.string()
  }),  
]);

/**
 * Fields are present with the same names as in Goodreads user updates RSS feeds.
 */
export const UserUpdateSchema = z.object({
  id: z.string(),
  title: z.string(),
  link: z.string().optional(),
  description: z.string().optional(),
  pubDate: z.string(),
  itemType: z.string().optional(),
  itemData: ItemDataSchema.optional()
});
export type UserUpdate = z.infer<typeof UserUpdateSchema>;