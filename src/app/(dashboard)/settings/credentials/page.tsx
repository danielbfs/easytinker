import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { CredentialsForm } from "./credentials-form"

export const dynamic = "force-dynamic"

export default async function CredentialsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const cred = await prisma.tinkerCredential.findUnique({
    where: { userId: session.user.id },
    select: {
      isValid: true,
      validatedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return (
    <main className="mx-auto w-full max-w-2xl flex flex-col gap-6 p-6 md:p-10">
      <header className="flex flex-col gap-1">
        <Link
          href="/projects"
          className="text-xs text-muted-foreground hover:underline"
        >
          ← Back to projects
        </Link>
        <h1 className="text-2xl font-bold">Tinker API Key</h1>
        <p className="text-sm text-muted-foreground">
          Required to list base models and run training jobs.
        </p>
      </header>

      <CredentialsForm
        initialStatus={
          cred
            ? {
                isValid: cred.isValid,
                validatedAt: cred.validatedAt?.toISOString() ?? null,
                createdAt: cred.createdAt.toISOString(),
                updatedAt: cred.updatedAt.toISOString(),
              }
            : null
        }
      />
    </main>
  )
}
