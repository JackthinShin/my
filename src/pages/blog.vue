<script setup lang="ts">
const postModules = import.meta.glob('./posts/*.md', { eager: true })

// 先打印出来看结构
console.log(Object.entries(postModules)[0])

const posts = Object.entries(postModules).map(([path, mod]: any) => ({
  path: path.replace('.', '').replace('.md', ''),
  title: mod.frontmatter?.title ?? mod.title ?? path,
  date: mod.frontmatter?.date ?? mod.date ?? '',
})).sort((a, b) => b.date.localeCompare(a.date))
</script>

<template>
  <div class="max-w-2xl mx-auto px-6 py-16">
    <h1 class="text-3xl font-bold mb-10">Blog</h1>
    <div v-if="posts.length === 0" class="text-gray-400">
      还没有文章，快去写第一篇吧！
    </div>
    <div v-for="post in posts" :key="post.path" class="mb-8">
      <div class="text-sm text-gray-400 mb-1">{{ post.date }}</div>
      <router-link :to="post.path" class="text-xl hover:underline">
        {{ post.title }}
      </router-link>
    </div>
  </div>
</template>