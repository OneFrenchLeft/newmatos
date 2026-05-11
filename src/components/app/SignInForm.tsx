import { ILogin, loginSchema } from "@/common/validation/auth"
import { zodFormikAdapter } from "@/common/validation/zodFormikAdapter"
import Button from "@/components/ui/Button"
import Logo from "@/components/ui/Logo"
import { Field, Form, Formik } from "formik"
import { signIn } from "next-auth/react"
import Head from "next/head"
import Link from "next/link"
import { useCallback, useEffect } from "react"
import toast from "react-hot-toast"
import LoadingDots from "../ui/LoadingDots"

interface SignInFormProps {
  callbackUrl: string
  error: string | null
}

const SignInForm = ({ callbackUrl, error }: SignInFormProps) => {
  const logo = "/favicon.ico"

  const handleSubmit = useCallback(
    async (values: ILogin) => {
      await signIn("credentials", { ...values, callbackUrl })
    },
    [callbackUrl],
  )

  useEffect(() => {
    if (error) {
      toast.error(errorMessages[error] || "Veuillez r\u00e9essayer plus tard", {
        id: "error-message",
      })
    }

    return () => toast.dismiss("error-message")
  }, [error])

  return (
    <div className="bg-main flex min-h-screen flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Me connecter - MonMatos</title>
        <link rel="icon" href={logo} />
        <link rel="shortcut icon" type="image/x-icon" href={logo} />
        <link rel="apple-touch-icon" sizes="180x180" href={logo} />
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
      </Head>
      <Formik
        initialValues={{ identifier: "" }}
        validationSchema={zodFormikAdapter(loginSchema)}
        onSubmit={handleSubmit}
      >
        {({ isValid, isSubmitting, dirty }) => (
          <div className="mx-auto sm:w-full sm:max-w-lg">
            <Logo className="mb-6 pl-4" />
            <Form className="mx-auto flex flex-col gap-10 rounded-md bg-white p-5 text-slate-900 shadow-lg sm:p-10">
              <h1 className="text-2xl font-bold">
                Connectez-vous \u00e0 votre{" "}
                <span className="text-emerald-600">Groupe</span>
              </h1>
              <label htmlFor="identifier" className="-mb-8 font-medium">
                Nom du groupe
              </label>
              <div className="flex w-full items-center">
                <div className="flex w-full items-center gap-4 rounded-lg border border-gray-200 p-3 focus-within:border-2 focus-within:border-blue-500">
                  <Field
                    name="identifier"
                    id="identifier"
                    type="text"
                    autoFocus
                    placeholder="ex: Saint Vincent de Paul"
                    className="w-full bg-transparent text-sm outline-none"
                    autoComplete="off"
                  />
                </div>
              </div>
              <p className="-mt-6 text-xs text-slate-400">
                Entrez le nom exact de votre groupe scout.
              </p>
              <Button
                size="lg"
                variant="black"
                disabled={isSubmitting || !isValid || !dirty}
                className="mx-auto text-base font-medium normal-case"
                type="submit"
              >
                {isSubmitting ? <LoadingDots /> : "Continuer"}
              </Button>
              <p className="text-sm">
                Votre groupe n'est pas encore enregistr\u00e9 ?{" "}
                <Link
                  href="/inscription"
                  className="w-fit pl-1 font-medium text-blue-500 focus:bg-blue-300/20 focus:outline-none"
                >
                  Inscrivez-le
                </Link>
              </p>
            </Form>
            <Link
              href="/"
              className="mx-auto mt-10 block w-fit text-sm underline"
            >
              Revenir \u00e0 l'accueil
            </Link>
          </div>
        )}
      </Formik>
    </div>
  )
}

const errorMessages: Record<string, string> = {
  CredentialsSignin: "Nom de groupe incorrect ou inexistant",
  SessionRequired: "Veuillez vous reconnecter",
  GroupNotFound: "Nous n'avons pas trouv\u00e9 ce groupe",
}

export default SignInForm
