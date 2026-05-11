import Link from "next/link"

const LinkLogin = () => (
  <p className="text-center text-sm text-slate-500">
    Déjà un compte ?{" "}
    <Link href="/connexion" className="font-semibold text-slate-800 underline hover:no-underline">
      Se connecter
    </Link>
  </p>
)

export default LinkLogin
