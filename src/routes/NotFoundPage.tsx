import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState, PRIMARY_BUTTON } from '@/components/feed/States';
import { PageContainer } from '@/components/layout/Page';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function NotFoundPage() {
  useDocumentTitle('Page not found');
  return (
    <PageContainer>
      <EmptyState
        icon={Compass}
        title="This page doesn't exist"
        description="The link may be old or mistyped."
        action={
          <Link to="/" className={PRIMARY_BUTTON}>
            Back to your feed
          </Link>
        }
        className="mt-10"
      />
    </PageContainer>
  );
}
