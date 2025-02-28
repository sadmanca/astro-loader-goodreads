import type { Loader } from 'astro/loaders';
import { BookSchema } from './schema.js';
import type { Book } from './schema.js';
import { XMLParser } from 'fast-xml-parser';

export interface GoodreadsLoaderOptions {
  url: string;
}

export function goodreadsLoader({
  url
}: GoodreadsLoaderOptions): Loader {
  return {
    name: 'astro-goodreads-loader',
    schema: BookSchema,

    async load({ store, logger, parseData, meta, generateDigest }) {
      logger.info('Fetching books from Goodreads');

      if (!url) {
        logger.error('url is not provided.');
        return;
      }

      try {
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch from Goodreads: ${response.statusText}`);
        }

        const data = await response.text();
        const parser = new XMLParser();
        const result = parser.parse(data);
        store.clear();

        const goodreadsShelfBooks: Book[] = result.rss.channel.item.map((item: any) => {
          const {
            book_id,
            title,
            guid,
            pubDate,
            link,
            book_image_url,
            book_small_image_url,
            book_medium_image_url,
            book_large_image_url,
            book_description,
            num_pages,
            author_name,
            isbn,
            user_name,
            user_rating,
            user_read_at,
            user_date_added,
            user_date_created,
            user_shelves,
            user_review,
            average_rating,
            book_published
          } = item;

          return {
            id: book_id,
            title,
            guid,
            pubDate,
            link,
            book_id,
            book_image_url,
            book_small_image_url,
            book_medium_image_url,
            book_large_image_url,
            book_description,
            num_pages,
            author_name,
            isbn,
            user_name,
            user_rating,
            user_read_at,
            user_date_added,
            user_date_created,
            user_shelves,
            user_review,
            average_rating,
            book_published
          };
        });

        await Promise.all(goodreadsShelfBooks.map(async (book) => {
          try {
            const parsedData = await parseData({
              id: book.id,
              data: book
            });

            store.set({
              id: book.id,
              data: parsedData
            });
          } catch (error) {
            logger.error(`Failed to parse book [${book.title}] (${book.id}): ${error}`);
            logger.error(`-----`);
            logger.error(`Book data: ${JSON.stringify(book)}`);
            logger.error(`-----`);
          }
        }));

        logger.info('Successfully loaded books from Goodreads');
      } catch (error) {
        logger.error(`Failed to load books from Goodreads: ${error}`);
        throw error;
      }
    }
  };
}