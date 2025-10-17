import { notFound } from "next/navigation";
import VerifyOTPPage from "./VerifyOTPPage";

export default async function Page({ searchParams }: any) {
  const { email } = await searchParams;

  if (!email) {
    notFound();
  };

  return <VerifyOTPPage email={email} />
}