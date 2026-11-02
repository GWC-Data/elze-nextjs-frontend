import { Link } from '@/lib/router'
import { SearchX } from 'lucide-react'
import { usePaths } from '@/hooks/usePaths'
import { Page, Section } from '@/components/common/Page'
import { EmptyState } from '@/components/common/States'
import { Button } from '@/components/ui/button'

export function PlaybookNotFound() {
  const paths = usePaths()
  return (
    <Page>
      <Section className="mt-0">
        <EmptyState
          icon={SearchX}
          title="Playbook not found"
          action={
            <Button asChild variant="outline">
              <Link to={paths.playbooks}>Back to playbooks</Link>
            </Button>
          }
        />
      </Section>
    </Page>
  )
}
