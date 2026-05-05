import { Skeleton } from '@/Components/ui/skeleton';

export function PageSkeleton() {
    return (
        <div className="flex flex-col gap-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 rounded-lg" />
                ))}
            </div>
            <Skeleton className="h-72 rounded-lg" />
        </div>
    );
}
