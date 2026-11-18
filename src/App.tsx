import { Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { FeedPage } from '@/routes/FeedPage';
import { BookmarksPage, UpvotedPage } from '@/routes/LibraryPages';
import { NotFoundPage } from '@/routes/NotFoundPage';
import { SearchPage } from '@/routes/SearchPage';
import { TodayPage } from '@/routes/TodayPage';

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<FeedPage mode="latest" />} />
        <Route path="popular" element={<FeedPage mode="popular" />} />
        <Route path="today" element={<TodayPage />} />
        <Route path="today/:date" element={<TodayPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="bookmarks" element={<BookmarksPage />} />
        <Route path="upvoted" element={<UpvotedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
