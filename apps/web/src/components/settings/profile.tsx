import { User } from "@supabase/supabase-js";
import { CircleUser } from "lucide-react";
import Image from "next/image";
import { Label } from "../ui/label";
export function Profile({ user }: { user: User }) {
  return (
    <div className="flex w-full items-center gap-4">
      {user?.user_metadata.avatar_url ? (
        <Image
          src={user?.user_metadata.avatar_url ?? ""}
          alt="Profile"
          className="aspect-square rounded-full object-cover border border-muted-foreground size-12"
          width={80}
          height={80}
          priority
        />
      ) : (
        <CircleUser
          className="size-16 text-muted-foreground"
          strokeWidth={1.5}
        />
      )}
      <div className="flex flex-col">
        <Label id="name" className=" font-medium text-lg">
          {user?.user_metadata.name}
        </Label>
        <Label
          id="email"
          className="text-sm font-normal text-muted-foreground -mt-0.5"
        >
          {user?.email}
        </Label>
      </div>
    </div>
  );
}
