import { cn } from "@/lib/utils"
import { Button } from "@/Components/ui/button"
import { Card, CardContent } from "@/Components/ui/card"
import { Input } from "@/Components/ui/input"
import { Label } from "@/Components/ui/label"
import { Link, useForm } from "@inertiajs/react"
import { FormEventHandler } from "react"
import InputError from "@/Components/InputError"

interface LoginFormProps extends React.ComponentProps<"div"> {
  status?: string
  canResetPassword: boolean
}

export function LoginForm({
  className,
  status,
  canResetPassword,
  ...props
}: LoginFormProps) {
  const { data, setData, post, processing, errors, reset } = useForm({
    email: "",
    password: "",
    remember: false as boolean,
  })

  const submit: FormEventHandler = (e) => {
    e.preventDefault()
    post(route("login"), {
      onFinish: () => reset("password"),
    })
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={submit}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-balance text-muted-foreground">
                  Login to your Moonly account
                </p>
              </div>

              {status && (
                <div className="text-sm font-medium text-green-600">
                  {status}
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="@moonlysoftware.com"
                  value={data.email}
                  autoComplete="username"
                  autoFocus
                  onChange={(e) => setData("email", e.target.value)}
                  required
                />
                <InputError message={errors.email} />
              </div>

              <div className="grid gap-2 pb-8">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  {canResetPassword && (
                    <Link
                      href={route("password.request")}
                      className="ml-auto text-sm underline-offset-2 hover:underline"
                    >
                      Forgot your password?
                    </Link>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  value={data.password}
                  autoComplete="current-password"
                  onChange={(e) => setData("password", e.target.value)}
                  required
                />
                <InputError message={errors.password} />
              </div>

              <Button type="submit" className="w-full" disabled={processing}>
                Login
              </Button>

              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href={route("register")} className="underline underline-offset-4">
                  Sign up
                </Link>
              </div>
            </div>
          </form>
          <div className="relative hidden bg-muted md:block">
            <img
              src="/storage/authentication-hero.png"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
