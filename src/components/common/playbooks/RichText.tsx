const PATTERN = /(\*\*[^*]+\*\*|`[^`]+`)/g

export function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(PATTERN).map((part, index) => {
        if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={index} className="font-semibold text-foreground">
              {part.slice(2, -2)}
            </strong>
          )
        }
        if (part.length > 2 && part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={index} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] text-foreground">
              {part.slice(1, -1)}
            </code>
          )
        }
        return part
      })}
    </>
  )
}
