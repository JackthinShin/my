<script setup lang="ts">
</script>

<template>
  <div style="max-width: 640px; margin: 0 auto; padding: 1.5rem 1.25rem; font-family: var(--font-sans);">

    <!-- Hero -->
    <div style="text-align: center; padding: 3.5rem 0 2.5rem;">
      <img src="/Avatar.jpg" alt="avatar"
        class="w-21 h-21 rounded-full mx-auto mb-5 object-cover border border-gray-200 dark:border-gray-700" />
      <h1 class="text-2xl font-medium mb-1 text-gray-900 dark:text-gray-100">Jackthin</h1>
      <p class="text-sm text-gray-400 mb-5 tracking-wide">
        CS Student · CV Researcher · Photographer
      </p>
      <div class="flex justify-center gap-5 flex-wrap">
        <a href="/blog" class="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 no-underline transition-colors">Blog</a>
        <a href="/projects" class="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 no-underline transition-colors">Projects</a>
        <a href="https://photoflife.site" target="_blank" class="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 no-underline transition-colors">Photos</a>
        <a href="/about" class="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 no-underline transition-colors">About</a>
      </div>
    </div>

    <div class="border-t border-gray-100 dark:border-gray-800" />

    <!-- 简介 -->
    <div class="py-8">
      <p class="text-sm text-gray-600 dark:text-gray-400 leading-loose m-0">
        你好，我是 Jackthin，就读于中国海洋大学计算机科学专业（大一），在计算机视觉实验室参与科研工作。
        对图像处理、深度学习和摄影都有浓厚兴趣，希望把技术和视觉创作结合起来。
      </p>
    </div>

    <div class="border-t border-gray-100 dark:border-gray-800" />

    <!-- 正在做的事 -->
    <div class="py-8">
      <p class="text-xs text-gray-400 mb-4 uppercase tracking-widest">Now</p>
      <div class="flex flex-col gap-3">
        <div class="flex items-start gap-3">
          <span class="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 mt-2 shrink-0" />
          <span class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">精读 CV 方向论文（ViT · DeiT · MAE · CLIP），建立视觉模型知识体系</span>
        </div>
        <div class="flex items-start gap-3">
          <span class="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 mt-2 shrink-0" />
          <span class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">使用 Unitree Go2 四足机器人研究 SLAM 建图与自主导航</span>
        </div>
        <div class="flex items-start gap-3">
          <span class="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 mt-2 shrink-0" />
          <span class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">搭建个人博客与摄影网站，探索技术与视觉创作的结合</span>
        </div>
      </div>
    </div>

    <div class="border-t border-gray-100 dark:border-gray-800" />

    <!-- 研究方向 -->
    <div class="py-8">
      <p class="text-xs text-gray-400 mb-4 uppercase tracking-widest">Interests</p>
      <div class="flex flex-wrap gap-2">
        <span v-for="tag in ['Computer Vision', 'Image Processing', 'SLAM & Robotics', 'Vision-Language Models', 'Photography', 'Creative Technology']"
          :key="tag"
          class="text-xs text-gray-500 dark:text-gray-400 px-3 py-1 border border-gray-200 dark:border-gray-700 rounded-full">
          {{ tag }}
        </span>
      </div>
    </div>

    <div class="border-t border-gray-100 dark:border-gray-800" />

    <!-- 精选项目 -->
    <div class="py-8">
      <p class="text-xs text-gray-400 mb-4 uppercase tracking-widest">Projects</p>
      <div class="flex flex-col gap-3">

        <a href="https://photoflife.site" target="_blank"
          class="block p-4 border border-gray-100 dark:border-gray-800 rounded-xl no-underline hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
          <div class="flex justify-between items-center mb-1.5">
            <span class="text-sm font-medium text-gray-800 dark:text-gray-200">Photoflife</span>
            <span class="text-xs text-gray-400">摄影</span>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 m-0 leading-relaxed">个人摄影作品集，Sony A7C2 拍摄，Cloudinary 托管，Vercel 部署。</p>
        </a>

        <div class="p-4 border border-gray-100 dark:border-gray-800 rounded-xl">
          <div class="flex justify-between items-center mb-1.5">
            <span class="text-sm font-medium text-gray-800 dark:text-gray-200">UAV 海岸监测系统</span>
            <span class="text-xs text-gray-400">CV · 研究</span>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 m-0 leading-relaxed">基于无人机的海岸线图像采集与处理，研究中。</p>
        </div>

        <div class="p-4 border border-gray-100 dark:border-gray-800 rounded-xl">
          <div class="flex justify-between items-center mb-1.5">
            <span class="text-sm font-medium text-gray-800 dark:text-gray-200">Go2 SLAM 导航</span>
            <span class="text-xs text-gray-400">机器人</span>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 m-0 leading-relaxed">Unitree Go2 四足机器人 SLAM 建图与自主导航，研究中。</p>
        </div>

        <div class="p-4 border border-gray-100 dark:border-gray-800 rounded-xl">
          <div class="flex justify-between items-center mb-1.5">
            <span class="text-sm font-medium text-gray-800 dark:text-gray-200">个人博客</span>
            <span class="text-xs text-gray-400">前端</span>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 m-0 leading-relaxed">基于 Vitesse（Vite + Vue 3 + UnoCSS）搭建的个人博客，记录研究与生活。</p>
        </div>

      </div>
    </div>

    <div class="border-t border-gray-100 dark:border-gray-800" />

    <!-- 社交链接 -->
    <div class="py-8 flex justify-center gap-7 flex-wrap">
      <a href="https://github.com/jackthinshin" target="_blank"
        class="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 no-underline flex items-center gap-1.5 transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
        </svg>
        GitHub
      </a>
      <a href="https://photoflife.site" target="_blank"
        class="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 no-underline flex items-center gap-1.5 transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M20.188 10.934l-1.368-2.392A2 2 0 0 0 17.062 7.5H6.938a2 2 0 0 0-1.758 1.042L3.812 10.934A2 2 0 0 0 3.5 12v5a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-5a2 2 0 0 0-.312-1.066z"/>
        </svg>
        Photos
      </a>
      <a href="jackthin@foxmail.com"
        class="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 no-underline flex items-center gap-1.5 transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="4" width="20" height="16" rx="2"/>
          <path d="m2 7 10 7 10-7"/>
        </svg>
        Email
      </a>
      <a href="/blog"
        class="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 no-underline flex items-center gap-1.5 transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
        Blog
      </a>
    </div>

  </div>
</template>