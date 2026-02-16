import { cn } from "@/lib/utils"
import { Button } from "@/Components/ui/button"
import { Card, CardContent } from "@/Components/ui/card"
import { Input } from "@/Components/ui/input"
import { Label } from "@/Components/ui/label"
import { Link, useForm } from "@inertiajs/react"
import { FormEventHandler } from "react"
import InputError from "@/Components/InputError"

interface RegisterFormProps extends React.ComponentProps<"div"> {}

export function RegisterForm({
  className,
  ...props
}: RegisterFormProps) {
  const { data, setData, post, processing, errors, reset } = useForm({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  })

  const submit: FormEventHandler = (e) => {
    e.preventDefault()
    post(route("register"), {
      onFinish: () => reset("password", "password_confirmation"),
    })
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={submit}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Create an account</h1>
                <p className="text-balance text-muted-foreground">
                  Sign up for your Moonly account
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={data.name}
                  autoComplete="name"
                  autoFocus
                  onChange={(e) => setData("name", e.target.value)}
                  required
                />
                <InputError message={errors.name} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="@moonlysoftware.com"
                  value={data.email}
                  autoComplete="username"
                  onChange={(e) => setData("email", e.target.value)}
                  required
                />
                <InputError message={errors.email} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={data.password}
                  autoComplete="new-password"
                  onChange={(e) => setData("password", e.target.value)}
                  required
                />
                <InputError message={errors.password} />
              </div>

              <div className="grid gap-2 pb-4">
                <Label htmlFor="password_confirmation">Confirm Password</Label>
                <Input
                  id="password_confirmation"
                  type="password"
                  value={data.password_confirmation}
                  autoComplete="new-password"
                  onChange={(e) => setData("password_confirmation", e.target.value)}
                  required
                />
                <InputError message={errors.password_confirmation} />
              </div>

              <Button type="submit" className="w-full" disabled={processing}>
                Register
              </Button>

              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link href={route("login")} className="underline underline-offset-4">
                  Login
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
