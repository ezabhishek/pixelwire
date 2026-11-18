import { useQuery } from '@tanstack/react-query';
import { fetchArticleDetail } from '@/api/detail';
import { queryKeys } from '@/api/queryClient';
import type { Article, ArticleDetail } from '@/types/article';

export function useArticleDetail(article: Article | null) {
  return useQuery<ArticleDetail>({
    queryKey: queryKeys.article(article?.id ?? 'none'),
    queryFn: ({ signal }) => {
      if (!article) throw new Error('No article selected');
      return fetchArticleDetail(article, signal);
    },
    enabled: article !== null,
    staleTime: 10 * 60 * 1000,
  });
}
