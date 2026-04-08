import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";
import { getSession } from "@/lib/session";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/profile");

  return (
    <div className="pb-8">
      <div className="px-4 pt-6">
        <Link
          href="/"
          className="text-muted hover:text-accent inline-flex items-center gap-1 text-sm font-medium transition-colors"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          Your challenges
        </Link>
      </div>
      <h1 className="px-4 pt-4 text-2xl font-semibold tracking-tight">
        Profile
      </h1>
      <div className="px-4 pt-4">
        <ProfileForm
          initialName={session.user.name}
          initialImage={session.user.image ?? null}
        />
      </div>
    </div>
  );
}
