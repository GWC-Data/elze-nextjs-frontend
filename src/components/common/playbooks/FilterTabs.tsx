import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export interface FilterOption<T extends string> {
  value: T
  label: string
  count?: number
}

export function FilterTabs<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T
  onChange: (value: NoInfer<T>) => void
  options: FilterOption<NoInfer<T>>[]
  label: string
}) {
  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as T)}>
      <TabsList aria-label={label}>
        {options.map((option) => (
          <TabsTrigger key={option.value} value={option.value} className="px-2.5">
            {option.label}
            {option.count !== undefined ? (
              <span className="text-xs text-muted-foreground tabular-nums">{option.count}</span>
            ) : null}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
