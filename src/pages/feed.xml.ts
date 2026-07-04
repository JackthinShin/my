import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const sortedPosts = posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return rss({
    title: "Jackthin's Blog",
    description: "Personal website of Jackthin — CS student, CV researcher, photographer.",
    site: context.site,
    items: sortedPosts.map(post => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description || '',
      link: `/blog/${post.id.replace(/\.md$/, '')}`,
    })),
    customData: `<language>zh-CN</language>`,
  });
}
