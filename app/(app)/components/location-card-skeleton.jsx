import {
  Card,
  CardContent,
  CardHeader,
} from '@/shadcn/components/ui/card'
import { Skeleton } from '@/shadcn/components/ui/skeleton'

export default function LocationCardSkeleton() {
  return (
    <Card
      className="gap-3 overflow-hidden rounded-2xl py-4 shadow-md"
      data-testid="location-card-skeleton"
    >
      <CardHeader className="px-4">
        <Skeleton className="h-5 w-3/5" />
        <Skeleton className="h-4 w-2/5" />
      </CardHeader>

      <CardContent className="flex flex-col gap-3 px-4">
        {/* Score bar */}
        <Skeleton className="h-2 w-full rounded-full" />

        {/* Score/badge row */}
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>

        {/* Conditions grid */}
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-3 w-10" />
              </div>
            </div>
          ))}
        </div>

        {/* Summary box */}
        <div className="bg-secondary rounded-lg px-3 py-2">
          <Skeleton className="h-12" />
        </div>
      </CardContent>
    </Card>
  )
}
