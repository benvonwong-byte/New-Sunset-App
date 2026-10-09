import { TYPE_META, type SpaceType } from '@/data/spaces'

export default function TypeIcon({ type, className = 'w-5 h-5' }: { type: SpaceType; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: TYPE_META[type].svg }}
    />
  )
}