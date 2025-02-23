import type { Loader } from 'astro/loaders';
import { BookSchema } from './schema.js';
import type { Book } from './schema.js';
import { XMLParser } from 'fast-xml-parser'

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

				const goodreadsShelfBooks = result.rss.channel.item.map((item: any) => {
					const highResImageUrl = item.book_image_url
						.replace(/\._[^.]+_/g, '') // remove any substring starting with "._" and ending with "_"
						.replace(/(\.\w+)$/, '._SX300_SY300_$1'); // add height and width size before the file extension
		  
					return {
						id: item.book_id,
						title: item.title,
						date_read: item.user_read_at,
						rating: item.user_rating,
						author_name: item.author_name,
						book_image_url: highResImageUrl,
					};
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
						logger.error(`Failed to parse highlight [${book.title}] (${book.id}): ${error}`);
					}
				}

				logger.info('Successfully loaded highlights from Goodreads');
			} catch (error) {
				logger.error(`Failed to load highlights from Goodreads: ${error}`);
				throw error;
			}
		}
	};
}