import { useEffect, useState } from 'react'
import { CircleCheck, Zap } from 'lucide-react'
import { notify } from '@/lib/notify'
import { currentTime, runSteps } from '@/lib/playbookInsights'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { AgentThread } from '@/components/common/playbooks/AgentThread'
import { usePlaybookStore } from '@/components/common/playbooks/PlaybookStore'
import type { Playbook } from '@/types/playbooks'

const STEP_DELAY = 480

export function RunPlaybookDialog({
  playbook,
  onClose,
  onCompleted,
}: {
  playbook: Playbook | null
  onClose: () => void
  onCompleted?: () => void
}) {
  return (
    <Dialog open={playbook !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        {playbook ? (
          <RunProgress key={playbook.id} playbook={playbook} onClose={onClose} onCompleted={onCompleted} />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function RunProgress({
  playbook,
  onClose,
  onCompleted,
}: {
  playbook: Playbook
  onClose: () => void
  onCompleted?: () => void
}) {
  const { completeRun } = usePlaybookStore()
  const [steps] = useState(() => runSteps(playbook))
  const [stamps, setStamps] = useState<string[]>([])
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (done) return
    const timer = window.setTimeout(
      () => {
        if (stamps.length < steps.length) {
          setStamps((previous) => [...previous, currentTime()])
          return
        }
        setDone(true)
        completeRun(playbook.id)
        notify.success(`${playbook.name} executed successfully.`)
        onCompleted?.()
      },
      stamps.length === 0 ? 0 : STEP_DELAY
    )
    return () => window.clearTimeout(timer)
  }, [stamps.length, steps.length, done, completeRun, playbook.id, playbook.name, onCompleted])

  const visible = steps.slice(0, stamps.length).map((step, index) => ({ ...step, time: stamps[index] }))
  const progress = done ? 100 : Math.round((stamps.length / steps.length) * 100)

  return (
    <>
      <DialogHeader>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
          <Zap className="size-3.5" aria-hidden />
          Playbook execution
        </span>
        <DialogTitle>{playbook.name}</DialogTitle>
        <DialogDescription className="sr-only">Live progress of this playbook run.</DialogDescription>
      </DialogHeader>

      <Progress value={progress} aria-label="Run progress" />

      <AgentThread steps={visible} live={!done} className="min-h-40" />

      {done ? (
        <DialogFooter className="items-center sm:justify-between">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
            <CircleCheck className="size-4" aria-hidden />
            Execution completed
          </span>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      ) : null}
    </>
  )
}
