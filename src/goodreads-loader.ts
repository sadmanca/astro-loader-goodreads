import type { Loader } from 'astro/loaders';
import { BookSchema, AuthorBlogSchema, UserUpdateSchema } from './schema.js';
import type { Book, AuthorBlog, UserUpdate } from './schema.js';
import { XMLParser } from 'fast-xml-parser';

export interface GoodreadsLoaderOptions {
  url: string;
}

// Function to decode HTML entities
function decodeHtmlEntities(text: string): string {
  const entities = {
    '&lt;': '<',
    '&gt;': '>',
    '&amp;': '&',
    '&quot;': '"',
    '&#39;': "'"
  };
  return text.replace(/&lt;|&gt;|&amp;|&quot;|&#39;/g, match => entities[match]);
}

const urlSchemaMap = [
  {
    name: 'author-blog',
    pattern: /goodreads\.com\/author/,
    schema: AuthorBlogSchema,
    parseItem: (item: any, url: string): AuthorBlog => {
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
    parseItem: (item: any, url: string): Book => ({
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
    parseItem: (item: any, url: string): UserUpdate => {
      let description = item.description || '';

      item.title = decodeHtmlEntities(item.title);

      let itemData;
      let itemType = undefined;

      const userIdMatch = url.match(/goodreads\.com\/user\/updates_rss\/(\d+)/);
      const userId = userIdMatch ? userIdMatch[1] : '';
      const userUrl = `https://www.goodreads.com/user/show/${userId}`;

      if (item.guid.match(/AuthorFollowing/)) {
        itemType = 'AuthorFollowing';

        const itemDataMatch = item.title.match(/<AuthorFollowing id=(\d+)\s+user_id=(\d+)\s+author_id=(\d+)>/);

        const followId = itemDataMatch ? itemDataMatch[1] : '';
        const authorId = itemDataMatch ? itemDataMatch[3] : '';

        item.title = itemDataMatch ? `User ${userId} followed Author ${authorId}` : item.title;
        item.link = itemDataMatch ? `https://www.goodreads.com/author/show/${authorId}` : "https://www.goodreads.com";
        itemData = {
          type: "AuthorFollowing",
          followId: followId,
          userUrl: userUrl,
          authorId: authorId,
        };
      } else if (item.guid.match(/UserStatus/)) {
        itemType = 'UserStatus';

        const percentReadMatch = item.title.match(/is (\d+)% done/);
        const bookIdMatch = description.match(/href="\/book\/show\/(\d+)-[^"]+"/);
        const bookTitleMatch = description.match(/title="([^"]+) by [^"]+"/);
        const bookAuthorMatch = description.match(/title="[^"]+ by ([^"]+)"/);
        const bookImgUrlMatch = description.match(/src="([^"]+)"/);

        const bookUrl = bookIdMatch ? `https://www.goodreads.com/book/show/${bookIdMatch[1]}` : '';

        itemData = {
          type: "UserStatus",
          userUrl: userUrl,
          percentRead: percentReadMatch ? percentReadMatch[1] : '',
          bookUrl: bookUrl,
          bookTitle: bookTitleMatch ? bookTitleMatch[1] : '',
          bookAuthor: bookAuthorMatch ? bookAuthorMatch[1] : '',
          bookImgUrl: bookImgUrlMatch ? bookImgUrlMatch[1] : '',
        };
      } else if (item.guid.match(/ReadStatus/)) {
        itemType = 'ReadStatus';

        const bookIdMatch = description.match(/href="\/book\/show\/(\d+)(?:\.[^"]+)?(?:-[^"]+)?"/);
        const bookTitleMatch = description.match(/title="([^"]+) by [^"]+"/);
        const bookAuthorMatch = description.match(/title="[^"]+ by ([^"]+)"/);
        const bookImgUrlMatch = description.match(/src="([^"]+)"/);
        const bookUrl = bookIdMatch ? `https://www.goodreads.com/book/show/${bookIdMatch[1]}` : '';

        let readingStatus = '';
        if (item.title.includes('started reading')) {
          readingStatus = 'started reading';
        } else if (item.title.includes('wants to read')) {
          readingStatus = 'wants to read';
        } else if (item.title.includes('finished reading')) {
          readingStatus = 'finished reading';
        }

        itemData = {
          type: "ReadStatus",
          userUrl: userUrl,
          readingStatus: readingStatus,
          bookUrl: bookUrl,
          bookTitle: bookTitleMatch ? bookTitleMatch[1] : '',
          bookAuthor: bookAuthorMatch ? bookAuthorMatch[1] : '',
          bookImgUrl: bookImgUrlMatch ? bookImgUrlMatch[1] : '',
        };
      } else if (item.guid.match(/Review/)) {
        itemType = 'Review';

        const ratingMatch = description.match(/gave (\d+) stars/);
        const bookIdMatch = description.match(/href="\/book\/show\/(\d+)-[^"]+"/);
        const bookTitleMatch = description.match(/title="([^"]+) by [^"]+"/);
        const bookAuthorMatch = description.match(/title="[^"]+ by ([^"]+)"/);
        const bookImgUrlMatch = description.match(/src="([^"]+)"/);
        const bookUrl = bookIdMatch ? `https://www.goodreads.com/book/show/${bookIdMatch[1]}` : '';

        itemData = {
          type: "Review",
          userUrl: userUrl,
          rating: ratingMatch ? parseInt(ratingMatch[1], 10) : 0,
          bookUrl: bookUrl,
          bookTitle: bookTitleMatch ? bookTitleMatch[1] : '',
          bookAuthor: bookAuthorMatch ? bookAuthorMatch[1] : '',
          bookImgUrl: bookImgUrlMatch ? bookImgUrlMatch[1] : '',
        };
      } else if (item.guid.match(/Rating/)) {
        if (item.title.includes('liked a review')) {
          itemType = 'LikeReview';
        
          const reviewIdMatch = description.match(/href="\/review\/show\/(\d+)"/);
          const reviewUserMatch = decodeHtmlEntities(description).match(/<a href="\/review\/show\/\d+">([^<]+)'s review<\/a>/);
          const bookIdMatch = description.match(/href="\/book\/show\/(\d+)-[^"]+"/);
          const bookTitleMatch = description.match(/title="([^"]+) by [^"]+"/);
          const bookImgUrlMatch = description.match(/src="([^"]+)"/);
          const bookUrl = bookIdMatch ? `https://www.goodreads.com/book/show/${bookIdMatch[1]}` : '';
          const reviewUrl = reviewIdMatch ? `https://www.goodreads.com/review/show/${reviewIdMatch[1]}` : '';
        
          itemData = {
            type: "LikeReview",
            userUrl: userUrl,
            reviewUrl: reviewUrl,
            reviewUser: reviewUserMatch ? reviewUserMatch[1] : '',
            bookUrl: bookUrl,
            bookTitle: bookTitleMatch ? bookTitleMatch[1] : '',
            bookImgUrl: bookImgUrlMatch ? bookImgUrlMatch[1] : '',
          };
        } else if (item.title.includes('liked a readstatus')) {
          itemType = 'LikeReadStatus';
      
          const readStatusUserMatch = decodeHtmlEntities(description).match(/<a class="updateImage" href="\/user\/show\/\d+-[^"]+"><img alt="[^"]+" src="([^"]+)" \/><\/a>\s*<a href="\/user\/show\/\d+-[^"]+">([^<]+)<\/a>/);
          const readStatusMatch = description.match(/<\/a>\s*(.*?)\s*<span class="js-tooltipTrigger/);
          const bookIdMatch = description.match(/href="\/book\/show\/(\d+)(?:\.[^"]+)?(?:-[^"]+)?"/);
          const bookTitleMatch = description.match(/href="\/book\/show\/\d+(?:\.|-)[\w\-\.]+">([^<]+)<\/a>/);
          const readStatusUserImgUrlMatch = description.match(/src="([^"]+)"/);
          const bookUrl = bookIdMatch ? `https://www.goodreads.com/book/show/${bookIdMatch[1]}` : '';
      
          itemData = {
            type: "LikeReadStatus",
            userUrl: userUrl,
            readStatusUser: readStatusUserMatch ? readStatusUserMatch[2] : '',
            readStatusUserImgUrl: readStatusUserImgUrlMatch ? readStatusUserImgUrlMatch[1] : '',
            readStatus: readStatusMatch ? readStatusMatch[1] : '',
            bookUrl: bookUrl,
            bookTitle: bookTitleMatch ? bookTitleMatch[1] : '',
          };
        }
      } else if (item.guid.match(/Comment/)) {
        if (item.title.includes('made a comment on') && item.title.includes(' status')) {
          itemType = 'CommentStatus';
          
          const statusUrlMatch = description.match(/href="(https:\/\/www\.goodreads\.com\/(?:read_statuses\/\d+|user_status\/show\/\d+))"/);
          const commentParts = description.split('<br/><br/>');
          const commentText = commentParts.length > 1 ? commentParts[1].trim() : '';
          const statusUserMatch = description.match(/>([^<]+?)’s status<\/a>/);
  
          itemData = {
            type: "CommentStatus",
            userUrl: userUrl,
            statusUrl: statusUrlMatch ? statusUrlMatch[1] : '',
            statusUser: statusUserMatch ? statusUserMatch[1] : '',
            comment: commentText,
          };

        } else if (item.title.includes('commented on') && item.title.includes('review of')) {
          itemType = 'CommentReview';

          const reviewUrlMatch = item.link.match(/(https:\/\/www\.goodreads\.com\/review\/show\/\d+)/);
          const reviewUserMatch = description.match(/<a class="userReview"[^>]*href="[^"]*">([^<]+)<\/a>/);
          const bookUrlMatch = description.match(/<a class="bookTitle" href="([^"]+)">/);
          const bookTitleMatch = description.match(/<a class="bookTitle"[^>]*>([^<]+)<\/a>/);
          const bookAuthorMatch = description.match(/<a class="authorName"[^>]*>([^<]+)<\/a>/);
          const commentParts = description.split('<br/><br/>');
          const commentText = commentParts.length > 1 ? commentParts[commentParts.length - 1].trim() : '';
      
          itemData = {
            type: "CommentReview",
            userUrl: userUrl,
            reviewUrl: reviewUrlMatch ? reviewUrlMatch[1] : item.link,
            reviewUser: reviewUserMatch ? reviewUserMatch[1] : '',
            bookUrl: bookUrlMatch ? `https://www.goodreads.com${bookUrlMatch[1]}` : '',
            bookTitle: bookTitleMatch ? bookTitleMatch[1] : '',
            bookAuthor: bookAuthorMatch ? bookAuthorMatch[1] : '',
            comment: commentText
          };
        }
      }

      description = description.replace(/href="\/book\/show\//g, 'href="https://www.goodreads.com/book/show/');
      description = description.replace(/href="\/user\/show\//g, 'href="https://www.goodreads.com/user/show/');
      description = description.replace(/href="\/author\/show\//g, 'href="https://www.goodreads.com/author/show/');
      description = description.replace(/href="\/review\/show\//g, 'href="https://www.goodreads.com/review/show/');
      description = description.replace(/href="\/read_statuses\//g, 'href="https://www.goodreads.com/read_statuses/');

      return {
        id: item.guid,
        title: item.title,
        link: item.link || '',
        description: description,
        pubDate: item.pubDate,
        itemType: itemType,
        itemData: itemData
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

        const items = result.rss.channel.item.map(item => matchedSchema.parseItem(item, url));

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