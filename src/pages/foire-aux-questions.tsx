import PublicLayout from "@/components/www/Layout"
import { ReactElement, useState } from "react"
import { NextPageWithLayout } from "./_app"
import Link from "next/link"

type FAQItem = {
  question: string
  answer: string | ReactElement
}

const faqItems: FAQItem[] = [
  {
    question: "Qui est \u00e0 l'origine de MonMatos ?",
    answer: (
      <span>
        MonMatos a \u00e9t\u00e9 cr\u00e9\u00e9 par{" "}
        <a
          href="https://github.com/pnwatin/monmatos"
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-600 underline hover:text-emerald-700"
        >
          pnwatin
        </a>
        . C'est lui qui a eu l'initiative du projet et pos\u00e9 les bases de l'application.
      </span>
    ),
  },
  {
    question: "Qui a repris l'initiative du projet ?",
    answer: (
      <span>
        Le projet a \u00e9t\u00e9 repris et maintenu par{" "}
        <a
          href="https://github.com/OneFrenchLeft/newmatos"
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-600 underline hover:text-emerald-700"
        >
          OneFrenchLeft
        </a>
        , qui continue d'am\u00e9liorer et faire \u00e9voluer l'application.
      </span>
    ),
  },
  {
    question: "L'IA a-t-elle \u00e9t\u00e9 utilis\u00e9e dans ce projet ?",
    answer:
      "Oui, de l'IA a \u00e9t\u00e9 utilis\u00e9e lors de la relecture du code, afin d'am\u00e9liorer la qualit\u00e9 et d\u00e9tecter d'\u00e9ventuelles erreurs.",
  },
  {
    question: "Comment h\u00e9berger MonMatos soi-m\u00eame ?",
    answer: (
      <ol className="mt-2 list-decimal space-y-2 pl-5 text-left text-slate-600">
        <li>
          <span className="font-semibold">Cloner le d\u00e9p\u00f4t</span>
          <pre className="mt-1 rounded-lg bg-slate-100 px-3 py-2 font-mono text-sm text-slate-800">
            git clone https://github.com/OneFrenchLeft/newmatos
          </pre>
        </li>
        <li>
          <span className="font-semibold">Installer les d\u00e9pendances</span>
          <pre className="mt-1 rounded-lg bg-slate-100 px-3 py-2 font-mono text-sm text-slate-800">
            npm install
          </pre>
        </li>
        <li>
          <span className="font-semibold">Configurer la base de donn\u00e9es</span>
          <p className="mt-1 text-sm">
            Renommer <code className="rounded bg-slate-100 px-1">.env.example</code> en{" "}
            <code className="rounded bg-slate-100 px-1">.env</code>, puis renseigner l'URL de votre base dans{" "}
            <code className="rounded bg-slate-100 px-1">DATABASE_URL</code>.
          </p>
          <pre className="mt-1 rounded-lg bg-slate-100 px-3 py-2 font-mono text-sm text-slate-800">
            npx prisma db push
          </pre>
        </li>
        <li>
          <span className="font-semibold">Lancer le serveur de d\u00e9veloppement</span>
          <pre className="mt-1 rounded-lg bg-slate-100 px-3 py-2 font-mono text-sm text-slate-800">
            npm run dev
          </pre>
        </li>
        <li>
          <span className="font-semibold">Acc\u00e9der \u00e0 l'application</span>
          <p className="mt-1 text-sm">
            Ouvrir{" "}
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 underline"
            >
              http://localhost:3000
            </a>{" "}
            dans votre navigateur.
          </p>
        </li>
      </ol>
    ),
  },
  {
    question: "Comment signaler un bug ou proposer une am\u00e9lioration ?",
    answer: (
      <span>
        Ouvrez une{" "}
        <a
          href="https://github.com/OneFrenchLeft/newmatos/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-600 underline hover:text-emerald-700"
        >
          issue sur GitHub
        </a>
        . Les contributions sont les bienvenues !
      </span>
    ),
  },
]

const FAQPage: NextPageWithLayout = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i)

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Foire aux questions
        </h1>
        <p className="mt-4 text-lg text-slate-500">
          Tout ce que vous devez savoir sur MonMatos.
        </p>
      </div>

      <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white shadow-sm">
        {faqItems.map((item, i) => (
          <div key={i}>
            <button
              type="button"
              onClick={() => toggle(i)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-base font-semibold text-slate-800 transition-colors hover:bg-slate-50"
              aria-expanded={openIndex === i}
            >
              <span>{item.question}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 shrink-0 text-emerald-500 transition-transform duration-300 ${
                  openIndex === i ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openIndex === i && (
              <div className="px-6 pb-6 text-base leading-relaxed text-slate-600">
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="mt-10 text-center text-sm text-slate-400">
        Une question non r\u00e9pondue ?{" "}
        <Link href="/contact" className="text-emerald-600 underline hover:text-emerald-700">
          Contactez-nous
        </Link>
      </p>
    </div>
  )
}

FAQPage.getLayout = (page: ReactElement) => <PublicLayout>{page}</PublicLayout>

export default FAQPage
