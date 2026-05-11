import Link from "next/link"
import { useRouter } from "next/router"
import Icon from "./Icon"

type Props = {
  label: string
  href: string
  icon?: string
}

const HeaderLink = ({ label, href, icon }: Props) => {
  const router = useRouter()
  const isActive = router.pathname === href

  return (
    <Link
      href={href}
      className={`flex items-center gap-2 transition-colors hover:text-emerald-600 ${
        isActive ? "font-semibold text-emerald-600" : "text-slate-600"
      }`}
    >
      {icon && <Icon name={icon} className="w-5" />}
      {label}
    </Link>
  )
}

export default HeaderLink
