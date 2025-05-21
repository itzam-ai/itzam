import { History, Loader2, SquarePen, User } from "lucide-react";
import Image from "next/image";
import EmptyStateDetails from "~/components/empty-state/empty-state-detais";
import { Skeleton } from "~/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col h-screen w-full mx-auto relative">
      <Image
        src="/logo.svg"
        alt="Logo"
        width={32}
        height={32}
        className="size-5 absolute top-12 left-12"
      />
      <div className="absolute top-12 right-12">
        <div className="flex items-center gap-8 mt-2">
          <History className="size-4" />

          <SquarePen className="size-4" />

          <User className="size-4 ml-1" />
        </div>
      </div>

      <div className="absolute inset-0 flex justify-center items-center">
        <EmptyStateDetails
          title="Loading..."
          description="Please wait..."
          icon={<Loader2 className="size-8 animate-spin" />}
          loading
        />
      </div>

      <div className="flex flex-col gap-4 pt-24 pb-64 w-full max-w-3xl mx-auto">
        {/* Input box loading state */}
        <div className="fixed bottom-0 left-0 right-0">
          <div className="w-full flex justify-center">
            <div className="flex flex-col max-w-3xl w-full">
              <div className="w-full max-w-3xl bg-background pb-12 rounded-t-3xl">
                <div className="flex flex-col p-4 pl-5 rounded-3xl bg-muted border border-muted-foreground/20 gap-4 shadow-lg">
                  <Skeleton className="h-8 w-full" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="size-8 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
