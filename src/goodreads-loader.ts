import type { Loader } from 'astro/loaders';
import { BookSchema, AuthorBlogSchema, UserUpdateSchema } from './schema.js';
import type { Book, AuthorBlog, UserUpdate } from './schema.js';
import { XMLParser } from 'fast-xml-parser';

export interface GoodreadsLoaderOptions {
  url: string;
}

const urlSchemaMap = [
  {
    name: 'author-blog',
    pattern: /goodreads\.com\/author/,
    schema: AuthorBlogSchema,
    parseItem: (item: any): AuthorBlog => {
      let description = item.description || '';
      const authorMatch = description.match(/posted by (.*?)\s+on/);
      const contentMatch = description.match(/<br\s*\/><br\s*\/>(.*?)<br\s*\/><br\s*\/>/s);

      return {
        id: item.link,
        title: item.title,
        link: item.link,
        description: description,
        pubDate: item.pubDate,
        author: authorMatch ? authorMatch[1].trim() : undefined,
        content: contentMatch ? contentMatch[1].trim() : undefined,
      };
    }
  },
  {
    name: 'shelf',
    pattern: /goodreads\.com\/review\/list(_rss)?\//,
    schema: BookSchema,
    parseItem: (item: any): Book => ({
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
      book_published: item.book_published
    })
  },
  {
    name: 'user-updates',
    pattern: /goodreads\.com\/user/,
    schema: UserUpdateSchema,
    parseItem: (item: any): UserUpdate => {
      let description = item.description || '';
      description = description.replace(/href="\/book\/show\//g, 'href="https://www.goodreads.com/book/show/');
      description = description.replace(/href="\/user\/show\//g, 'href="https://www.goodreads.com/user/show/');

      return {
        id: item.guid,
        title: item.title,
        link: item.link || '',
        description: description,
        pubDate: item.pubDate,
      };
    }
  }
];

export function goodreadsLoader({
  url
}: GoodreadsLoaderOptions): Loader {
  const matchedSchema = urlSchemaMap.find(({ pattern }) => pattern.test(url));

  if (!matchedSchema) {
    throw new Error('No matching schema found for the provided URL.');
  }

  return {
    name: 'astro-goodreads-loader',
    schema: matchedSchema.schema,

    async load({ store, logger, parseData, meta, generateDigest }) {
      logger.info(`Fetching data from Goodreads for ${matchedSchema.name} URL: ${url}`);

      if (!url) {
        logger.error('url is not provided.');
        return;
      }

      if (matchedSchema.name === 'author-blog') {
        if (!url.endsWith('blog?format=rss') && !url.endsWith('?format=rss')) {
          url += url.includes('blog') ? '?format=rss' : '/blog?format=rss';
        }
      }

      if (matchedSchema.name === 'shelf') {
        url = url.replace(/goodreads\.com\/review\/list\//, 'goodreads.com/review/list_rss/');
      }

      if (matchedSchema.name === 'user-updates') {
        const userIdMatch = url.match(/goodreads\.com\/user\/show\/(\d+)/);
        if (userIdMatch) {
          url = `https://www.goodreads.com/user/updates_rss/${userIdMatch[1]}`;
        }
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

        const items = result.rss.channel.item.map(matchedSchema.parseItem);

        await Promise.all(items.map(async (item) => {
          try {
            const parsedData = await parseData({
              id: item.id,
              data: item
            });

            store.set({
              id: item.id,
              data: parsedData
            });
          } catch (error) {
            logger.error(`Failed to parse item: ${error}`);
            logger.error(`-----`);
            logger.error(`Item data: ${JSON.stringify(item)}`);
            logger.error(`-----`);
          }
        }));

        logger.info(`Successfully loaded data from Goodreads for ${matchedSchema.name} URL: ${url}`);
      } catch (error) {
        logger.error(`Failed to load data from Goodreads (${matchedSchema.name} URL: ${url}): ${error}`);
        throw error;
      }
    }
  };
}