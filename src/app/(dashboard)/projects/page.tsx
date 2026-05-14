import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function ProjectsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <main className="mx-auto w-full max-w-3xl flex flex-col gap-6 p-6 md:p-10">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Link
          href="/settings/credentials"
          className="text-sm underline text-muted-foreground hover:text-foreground"
        >
          Settings
        </Link>
      </header>
      <p className="text-muted-foreground">
        Your fine-tuning projects will appear here.
      </p>
    </main>
  )
}
