import Skeleton from "../ui/Skeleton"

export default function PromptArenaLoader() {
  return (
    <div className="w-full min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto">

        {/* Title */}
        <div className="flex justify-center mb-8">
          <Skeleton className="h-10 w-72" />
        </div>

        <div className="flex flex-col xl:flex-row gap-6">

          {/* Leaderboard */}
          <div className="xl:w-[300px] w-full bg-[#0d0d0d] rounded-2xl p-4 space-y-6">

            <Skeleton className="h-6 w-40" />

            {/* player rows */}
            <div className="space-y-4">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>

            <Skeleton className="h-4 w-24 mt-6" />

            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* Center + Right Content */}
          <div className="flex-1 flex flex-col gap-6">

            {/* Image panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              <Skeleton className="h-[300px] md:h-[420px] w-full rounded-2xl" />

              <Skeleton className="h-[300px] md:h-[420px] w-full rounded-2xl" />

            </div>

            {/* Status bar */}
            <div className="bg-[#0d0d0d] rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center">

              <Skeleton className="h-10 w-full md:w-[320px]" />

              <Skeleton className="h-10 w-32 ml-auto" />

            </div>

            {/* Bottom Controls */}
            <div className="flex flex-col md:flex-row gap-4">

              <Skeleton className="h-12 w-full md:w-40" />

              <Skeleton className="h-12 flex-1" />

              <Skeleton className="h-12 w-full md:w-40" />

            </div>

          </div>
        </div>
      </div>
    </div>
  )
}