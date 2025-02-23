import type { Loader } from 'astro/loaders';
import { BookSchema } from './schema.js';
import type { Book } from './schema.js';
import { XMLParser } from 'fast-xml-parser';

export interface GoodreadsLoaderOptions {
  GOODREADS_SHELF_URL: string;
}

export function goodreadsLoader({
  GOODREADS_SHELF_URL
}: GoodreadsLoaderOptions): Loader {
  return {
    name: 'goodreads-loader',
    schema: BookSchema,

    async load({ store, logger, parseData, meta, generateDigest }) {
      logger.info('Fetching books from Goodreads');

      if (!GOODREADS_SHELF_URL) {
        logger.error('GOODREADS_SHELF_URL is not provided.');
        return;
      }

      try {
        const response = await fetch(GOODREADS_SHELF_URL);

        if (!response.ok) {
          throw new Error(`Failed to fetch from Goodreads: ${response.statusText}`);
        }

        const data = await response.text();
        const parser = new XMLParser();
        const result = parser.parse(data);
        store.clear();

        const goodreadsShelfBooks: Book[] = result.rss.channel.item.map((item: any) => {
          const highResImageUrl = item.book_image_url
            .replace(/\._[^.]+_/g, '') // remove any substring starting with "._" and ending with "_"
            .replace(/(\.\w+)$/, '._SX300_SY300_$1'); // add height and width size before the file extension

          const book: any = {
            id: item.book_id,
            title: item.title,
            guid: item.guid,
            pubDate: item.pubDate,
            link: item.link,
            book_id: item.book_id,
            book_image_url: item.book_image_url,
            book_small_image_url: item.book_small_image_url,
            book_medium_image_url: item.book_medium_image_url,
            book_large_image_url: item.book_large_image_url,
            book_description: item.book_description,
            num_pages: item.num_pages,
            author_name: item.author_name,
            isbn: item.isbn,
            user_name: item.user_name,
            user_rating: item.user_rating,
            user_read_at: item.user_read_at,
            user_date_added: item.user_date_added,
            user_date_created: item.user_date_created,
            user_shelves: item.user_shelves,
            user_review: item.user_review,
            average_rating: item.average_rating,
						book_published: item.book_published,
          };

          return book;
        });

        for (const book of goodreadsShelfBooks) {
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
        }

        logger.info('Successfully loaded books from Goodreads');
      } catch (error) {
        logger.error(`Failed to load books from Goodreads: ${error}`);
        throw error;
      }
    }
  };
}