import { GetServerSideProps } from "next"

export const getServerSideProps: GetServerSideProps = async () => {
  return { redirect: { destination: "/", permanent: false } }
}

export default function NousSoutenirPage() {
  return null
}
