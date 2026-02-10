import { LoginForm } from "@/Components/login-form"
import { Head } from "@inertiajs/react"

export default function LoginPage({
  status,
  canResetPassword,
}: {
  status?: string
  canResetPassword: boolean
}) {
  return (
    <>
      <Head title="Log in" />
      <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
        <div className="w-full max-w-sm md:max-w-3xl">
          <LoginForm status={status} canResetPassword={canResetPassword} />
        </div>
      </div>
    </>
  )
}
