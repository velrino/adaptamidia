import { SetMetadataTitle } from "@/app/utils/metadata";
import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: SetMetadataTitle("Login"),
  description: "Publicidade inteligente para negócios independentes",
};

export default async function SignIn() {
  if (process.env.NODE_ENV === "development") {
    const host = (await headers()).get("host") ?? "";
    const email = process.env.LOCAL_ADMIN_EMAIL;
    const password = process.env.LOCAL_ADMIN_PASSWORD;

    if (/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host) && email && password) {
      return <SignInForm initialValues={{ email, password }} />;
    }
  }

  return <SignInForm />;
}
