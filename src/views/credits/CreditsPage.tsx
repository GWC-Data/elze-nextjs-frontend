'use client'

import { Page, PageHeader } from '@/components/common/Page'
import { CompanyCreditsPanel } from '@/components/common/credits/CompanyCreditsPanel'

export default function CreditsPage() {
  return (
    <Page>
      <PageHeader title="Credits" description="Your company's balance, who is using it, and member limits." />
      <CompanyCreditsPanel showPrices />
    </Page>
  )
}
