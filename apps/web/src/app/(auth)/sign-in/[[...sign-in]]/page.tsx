import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">COYL</h1>
        <p className="mt-2 text-sm text-zinc-500">Your AI-powered execution partner</p>
      </div>
      <SignIn />
    </div>
  )
}
