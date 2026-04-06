import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">COYL</h1>
          <p className="mt-2 text-sm text-zinc-500">Your AI-powered execution partner</p>
        </div>
        <SignUp />
      </div>
    </div>
  )
}
