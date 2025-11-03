import RegisterPage from "./RegisterPage";

export default async function SignUpPage ({ searchParams }: any) {
  const { referralCode } = await searchParams
  return (
    <RegisterPage referralCode={referralCode} />
  )
}