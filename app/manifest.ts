import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'StudyTrack',
    short_name: 'StudyTrack',
    description: 'Your subjects, deadlines, reviewers, and study time in one place.',
    start_url: '/study',
    scope: '/',
    display: 'standalone',
    background_color: '#faf9f6',
    theme_color: '#6751d3',
    lang: 'en',
    categories: ['education', 'productivity'],
    icons: [
      { src: '/icons/app-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/app-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/app-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'My tasks', url: '/study#tasks', icons: [{ src: '/icons/app-192.png', sizes: '192x192' }] },
      { name: 'Weekly planner', url: '/study#week', icons: [{ src: '/icons/app-192.png', sizes: '192x192' }] },
    ],
  };
}
