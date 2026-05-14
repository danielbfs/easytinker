import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function ProjectsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold">Projects</h1>
      <p className="mt-4 text-muted-foreground">
        Your fine-tuning projects will appear here.
      </p>
    </main>
  );
}
