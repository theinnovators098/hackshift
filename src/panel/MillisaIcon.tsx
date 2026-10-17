import { forwardRef } from 'react'
import type { LucideProps } from 'lucide-react'

export const MillisaMarkIcon = forwardRef<SVGSVGElement, LucideProps>(function MillisaMarkIcon({ size = 17, ...rest }, ref) {
  return (
    <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" {...rest}>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
      <path d="M7 16v-4.4a2 2 0 0 1 4 0V16m0-4.4a2 2 0 0 1 4 0V16" />
      <circle cx="17.6" cy="6.6" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  )
})
