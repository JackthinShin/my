export function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function getReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  // Chinese text: ~300 chars per minute, English: ~200 words per minute
  // Approximate by character count for mixed content
  const charsPerMinute = 400;
  const minutes = Math.ceil(content.length / charsPerMinute);
  return Math.max(1, minutes);
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[\s]+/g, '-')
    .replace(/[^\w一-龥-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getAllTags(posts: { data: { tags?: string[] } }[]): string[] {
  const tagSet = new Set<string>();
  for (const post of posts) {
    if (post.data.tags) {
      for (const tag of post.data.tags) {
        tagSet.add(tag);
      }
    }
  }
  return [...tagSet].sort();
}
