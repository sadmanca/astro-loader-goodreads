# `astro-loader-goodreads`

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![bundle][bundle-src]][bundle-href]

[![Astro][astro-src]][astro-href]
[![Goodreads][goodreads-src]][goodreads-href]
[![How to use Goodreads data in Astro ][how-to-use-src]][how-to-use-href]

**Load Goodreads data for books in shelves/lists, user updates, and author blogs into Astro.**

> [!NOTE]
> `astro-loader-goodreads` uses the [Astro Content Loader API](https://docs.astro.build/en/reference/content-loader-reference/) to fetch data from Goodreads RSS feeds.
>
> See the [Usage](#usage) section below for instructions on how to use the package to load the fetched Goodreads data into [Astro Content Collections](https://docs.astro.build/en/guides/content-collections).

---

## Table of Contents

- [Features](#features)
- [Community Examples](#community-examples)
- [Installation](#installation)
- [Usage](#usage)
  - [Loader Options](#loader-options)
  - [Defining & Using Astro Content Collections](#defining--using-astro-content-collections)
    - [1. Goodreads Shelves](#1-goodreads-shelves)
    - [2. Goodreads User Updates](#2-goodreads-user-updates)
    - [3. Goodreads Author Blogs](#3-goodreads-author-blogs)
- [Data Schema](#data-schema)
  - [Overview](#overview)
  - [1. `BookSchema`](#1-bookschema)
  - [2. `UserUpdateSchema`](#2-userupdateschema)
  - [3. `AuthorBlogSchema`](#3-authorblogschema)

---

## Features

- **Load Bookshelves**: Import your Goodreads shelves to showcase your reading list, books you've read, or want to read.
- **User Updates**: Display your latest Goodreads activity including reading status updates, reviews, and likes.
- **Author Blogs**: Fetch author blogs from Goodreads to display updates from your favorite authors.
- **Astro Content Collections**: Seamlessly integrates with Astro's content collection system for type-safe data access.

## Community Examples

Below are some examples of websites that use `astro-loader-goodreads`. If you wish to add your site to this list, open a pull request!

| Site                           | Page                                       | Description                                             | Source                                  |
| ------------------------------ | ------------------------------------------ | ------------------------------------------------------- | --------------------------------------- |
| [sadman.ca](https://sadman.ca) | [sadman.ca/about](https://sadman.ca/about) | Books I'm currently reading and have recently finished. | [→](https://github.com/sadmanca/blogv2) |

---

## Installation

```sh
npm add astro-loader-goodreads
```

## Usage

### Loader Options

| Property              | Description                               | Required   |
| --------------------- | ----------------------------------------- | ---------- |
| `url` | The URL of your Goodreads shelf, user, or author. | ✅ |

### Defining & Using Astro Content Collections

`astro-loader-goodreads` supports loading Goodreads data from 3 types of urls:

1. **[Shelves](#1-goodreads-shelves)**: Load books from a Goodreads shelf.
2. **[User Updates](#2-goodreads-user-updates)**: Load a Goodreads user's updates feed.
3. **[Author Blogs](#3-goodreads-author-blogs)**: Load a Goodreads author's blog.

In your `content.config.ts` or `src/content/config.ts` file, you can define your content collections using each type of URL with the `goodreadsLoader` function.

> [!NOTE]
> For the full list of fields available for Astro content collections created using `astro-loader-goodreads`, see the [Data Schema](#data-schema) section below.

---

### 1. Goodreads Shelves

**To load data for books from a Goodreads shelf, use the shelf's URL** (e.g. https://www.goodreads.com/review/list/152185079-sadman-hossain?shelf=currently-reading). `astro-loader-goodreads` will convert it to the correct RSS feed URL automatically.

> [!IMPORTANT]
> **The RSS feed for a Goodreads shelf only includes the last 100 books added to that shelf.** This means that if there are more than 100 books in a shelf, `astro-loader-goodreads` will not be able to retrieve them all.
>
> You can, however, create multiple shelves (e.g. _read-2025_, _read-2026_, etc.) and then create a content collection for each shelf to get around this limitation.

```typescript
// src/content/config.ts
import { defineCollection } from "astro:content";
import { goodreadsLoader } from "astro-loader-goodreads";

const currentlyReading = defineCollection({
  loader: goodreadsLoader({
    url: "https://www.goodreads.com/review/list/152185079-sadman-hossain?shelf=currently-reading",
  }),
});

export const collections = { currentlyReading };
```

```astro
---
// src/pages/reading.astro
import { getCollection } from "astro:content";

const books = await getCollection("currentlyReading");
---

<h1>Books I'm Currently Reading</h1>

<div class="book-grid">
  {books.map((book) => (
    <div class="book-card">
      <img src={book.data.book_large_image_url} alt={`Cover of ${book.data.title}`} />
      <h2>{book.data.title}</h2>
      <p class="author">by {book.data.author_name}</p>
      {book.data.user_rating > 0 && (
        <p class="rating">My rating: {book.data.user_rating}/5</p>
      )}
      <a href={book.data.link} target="_blank" rel="noopener noreferrer">
        View on Goodreads
      </a>
    </div>
  ))}
</div>

<style>
  .book-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 2rem;
  }
  .book-card {
    border: 1px solid #eee;
    border-radius: 0.5rem;
    padding: 1rem;
    text-align: center;
  }
  .book-card img {
    max-width: 100%;
    height: auto;
  }
</style>
```

---

### 2. Goodreads User Updates

**To load a Goodreads user's updates feed, use the user's profile URL** (e.g. https://www.goodreads.com/user/show/152185079-sadman-hossain). `astro-loader-goodreads` will convert it to the correct RSS feed URL automatically.

> [!IMPORTANT]
> **The RSS feed for a Goodreads user's updates only includes the last 10 updates by that user.** This means that  `astro-loader-goodreads` cannot retrieve more than 10 updates for any single user.

```typescript
// src/content/config.ts
import { defineCollection } from "astro:content";
import { goodreadsLoader } from "astro-loader-goodreads";

const userUpdates = defineCollection({
  loader: goodreadsLoader({
    url: "https://www.goodreads.com/user/show/152185079-sadman-hossain",
  }),
});

export const collections = { userUpdates };
```

```astro
---
// src/pages/activity.astro
import { getCollection } from "astro:content";

const updates = await getCollection("userUpdates");

// Sort updates by publication date (newest first)
const sortedUpdates = updates.sort((a, b) => 
  new Date(b.data.pubDate).getTime() - new Date(a.data.pubDate).getTime()
);
---

<h1>My Goodreads Activity</h1>

<div class="activity-feed">
  {sortedUpdates.map((update) => {
    const itemData = update.data.itemData;
    
    return (
      <div class="activity-item">
        <p class="date">{new Date(update.data.pubDate).toLocaleDateString()}</p>
        
        {itemData?.type === "ReadStatus" && (
          <div class="read-status">
            <img 
              src={itemData.bookImgUrl} 
              alt={`Cover of ${itemData.bookTitle}`} 
              width="50"
            />
            <div>
              <p>
                <strong>{itemData.readingStatus}</strong> 
                <a href={itemData.bookUrl}>{itemData.bookTitle}</a> 
                by {itemData.bookAuthor}
              </p>
            </div>
          </div>
        )}
        
        {itemData?.type === "Review" && (
          <div class="review">
            <img 
              src={itemData.bookImgUrl} 
              alt={`Cover of ${itemData.bookTitle}`} 
              width="50"
            />
            <div>
              <p>
                Rated <strong>{itemData.rating} stars</strong> for 
                <a href={itemData.bookUrl}>{itemData.bookTitle}</a> 
                by {itemData.bookAuthor}
              </p>
            </div>
          </div>
        )}
        
        {itemData?.type === "CommentReview" && (
          <div class="comment-review">
            <div>
              <p>
                Commented on <a href={itemData.reviewUrl}>{itemData.reviewUser}'s review</a> of 
                <a href={itemData.bookUrl}>{itemData.bookTitle}</a>:
              </p>
              <blockquote>"{itemData.comment}"</blockquote>
            </div>
          </div>
        )}
        
        {/* Add additional item types as needed */}
      </div>
    );
  })}
</div>
```

---

### 3. Goodreads Author Blogs

**To load Goodreads author blog posts, use the author's URL** (e.g. https://www.goodreads.com/author/show/3389.Stephen_King). `astro-loader-goodreads` will append the necessary parameters to fetch the blog RSS feed automatically.

```typescript
// src/content/config.ts
import { defineCollection } from "astro:content";
import { goodreadsLoader } from "astro-loader-goodreads";

const authorBlog = defineCollection({
  loader: goodreadsLoader({
    url: "https://www.goodreads.com/author/show/3389.Stephen_King",
  }),
});

export const collections = { authorBlog };
```

```astro
---
// src/pages/author-updates.astro
import { getCollection } from "astro:content";

const posts = await getCollection("authorBlog");
---

<h1>Latest Updates from Stephen Kingn</h1>

<div class="blog-posts">
  {posts.map((post) => (
    <article class="blog-post">
      <h2>{post.data.title}</h2>
      <p class="date">Published: {new Date(post.data.pubDate).toLocaleDateString()}</p>
      {post.data.content && (
        <div class="content" set:html={post.data.content} />
      )}
      <a href={post.data.link}>Read on Goodreads</a>
    </article>
  ))}
</div>
```

---

## Data Schema

### Overview

The astro-loader-goodreads package provides three main schemas:

1. [`BookSchema`](#1-bookschema) - For books from Goodreads shelves
2. [`UserUpdateSchema`](#2-userupdateschema) - For user updates (with various activity types)
3. [`AuthorBlogSchema`](#3-authorblogschema) - For author blog posts

### 1. `BookSchema`

This schema is used when loading data from a Goodreads shelf.

```typescript
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
```

#### Book Fields

| Field | Description |
|-------|-------------|
| `id` | Unique identifier for the book |
| `title` | Book title |
| `guid` | Global unique identifier for this entry |
| `pubDate` | Publication date of this entry in the feed |
| `link` | URL to the book's Goodreads page |
| `book_id` | Goodreads ID for the book |
| `book_image_url` | URL to the book cover image |
| `book_small_image_url` | URL to small version of book cover (50×75 px) |
| `book_medium_image_url` | URL to medium version of book cover (65×98 px) |
| `book_large_image_url` | URL to large version of book cover (316×475 px) |
| `book_description` | Description/synopsis of the book |
| `num_pages` | Number of pages in the book (optional) |
| `author_name` | Name of the book's author |
| `isbn` | International Standard Book Number |
| `user_name` | Username of who added the book to their shelf |
| `user_rating` | Rating given by the user (0-5) |
| `user_read_at` | Date when the user finished reading the book |
| `user_date_added` | Date when the book was added to the user's shelf |
| `user_date_created` | Date when this entry was created |
| `user_shelves` | List of shelves the user assigned to this book (optional) |
| `user_review` | User's review of the book (optional) |
| `average_rating` | Average rating on Goodreads |
| `book_published` | Book's original publication date |

### 2. `UserUpdateSchema`

This schema is used when loading data from a Goodreads user's updates feed.

```typescript
export const UserUpdateSchema = z.object({
  id: z.string(),
  title: z.string(),
  link: z.string().optional(),
  description: z.string().optional(),
  pubDate: z.string(),
  itemType: z.string().optional(),
  itemData: ItemDataSchema.optional()
});
```

### `UserUpdateSchema` Item Types

The `itemData` field contains a discriminated union based on the `type` field:

#### `AuthorFollowing`

When a user follows an author:

```typescript
{
  type: "AuthorFollowing",
  followId: string,
  userUrl: string, 
  authorId: string
}
```

#### `UserStatus`

When a user reports progress on a book:

```typescript
{
  type: "UserStatus",
  userUrl: string,
  percentRead: string,
  bookUrl: string,
  bookTitle: string,
  bookAuthor: string,
  bookImgUrl: string
}
```

#### `ReadStatus`

When a user changes their reading status:

```typescript
{
  type: "ReadStatus",
  userUrl: string, 
  readingStatus: string, // 'started reading', 'wants to read', or 'finished reading'
  bookUrl: string,
  bookTitle: string,
  bookAuthor: string,
  bookImgUrl: string
}
```

#### `Review`

When a user posts a review:

```typescript
{
  type: "Review",
  userUrl: string,
  rating: number,
  bookUrl: string,
  bookTitle: string,
  bookAuthor: string,
  bookImgUrl: string
}
```

#### `LikeReview`

When a user likes someone's review:

```typescript
{
  type: "LikeReview",
  userUrl: string,
  reviewUrl: string,
  reviewUser: string,
  bookUrl: string,
  bookTitle: string,
  bookImgUrl: string
}
```

#### `LikeReadStatus`

When a user likes someone's read status:

```typescript
{
  type: "LikeReadStatus",
  userUrl: string,
  readStatusUser: string,
  readStatusUserImgUrl: string,
  readStatus: string,
  bookUrl: string,
  bookTitle: string
}
```

#### `CommentStatus`

When a user comments on a status:

```typescript
{
  type: "CommentStatus",
  userUrl: string,
  statusUrl: string,
  statusUser: string,
  comment: string
}
```

#### `CommentReview`

When a user comments on a review:

```typescript
{
  type: "CommentReview",
  userUrl: string,
  reviewUrl: string,
  reviewUser: string,
  bookUrl: string,
  bookTitle: string,
  bookAuthor: string,
  comment: string
}
```

### 3. `AuthorBlogSchema`

This schema is used when loading data from a Goodreads author's blog.

```typescript
export const AuthorBlogSchema = z.object({
  id: z.string(),
  title: z.string(),
  link: z.string(),
  description: z.string(),
  pubDate: z.string(),
  author: z.string().optional(),
  content: z.string().optional(),
});
```

### `AuthorBlogSchema` Fields

| Field | Description |
|-------|-------------|
| `id` | Unique identifier for the blog post |
| `title` | Blog post title |
| `link` | URL to the blog post |
| `description` | Raw HTML description of the blog post |
| `pubDate` | Publication date |
| `author` | Author's name (if available) |
| `content` | Main content of the blog post (if available) |

---

## License

`astro-loader-goodreads` is [MIT licensed](https://github.com/sadmanca/astro-loader-goodreads/blob/main/LICENSE).

---

Built with ♥ by [@sadmanca](https://github.com/sadmanca)!

[npm-version-src]: https://img.shields.io/npm/v/astro-loader-goodreads?style=flat&logo=npm&colorA=ea2039&colorB=2e2e2e
[npm-version-href]: https://npmjs.com/package/astro-loader-goodreads
[npm-downloads-src]: https://img.shields.io/npm/dm/astro-loader-goodreads?style=flat&logo=npm&colorA=ea2039&colorB=2e2e2e
[npm-downloads-href]: https://npmjs.com/package/astro-loader-goodreads
[license-src]: https://img.shields.io/badge/license-MIT-080f12?style=flat&colorA=2e2e2e&colorB=blue
[license-href]: https://github.com/sadmanca/astro-loader-goodreads/blob/main/LICENSE
[jsdocs-src]: https://img.shields.io/badge/jsdocs-astro--loader--goodreads-080f12?style=flat&colorA=2e2e2e&colorB=525252
[jsdocs-href]: https://www.jsdocs.io/package/astro-loader-goodreads
[bundle-src]: https://img.shields.io/bundlephobia/minzip/astro-loader-goodreads?style=flat&colorA=2e2e2e&colorB=1f8f00
[bundle-href]: https://bundlephobia.com/result?p=astro-loader-goodreads

[astro-src]: https://img.shields.io/badge/Astro-0690FA?style=flat&logo=astro&logoColor=ffffff&color=5e15a1
[astro-href]: https://astro.build
[goodreads-src]: https://img.shields.io/badge/Goodreads-0690FA?style=flat&logo=goodreads&logoColor=7e470f&color=e9e4d0
[goodreads-href]: https://goodreads.com
[how-to-use-src]: https://img.shields.io/badge/How_to_use_Goodreads_data_in_Astro-0690FA?style=flat&logo=amp&logoColor=6854ff&color=2e2e2e
[how-to-use-href]: https://sadman.ca/posts/how-to-use-goodreads-data-in-astro/