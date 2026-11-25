import { SetMetadataTitle } from "@/app/utils/metadata";
import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: SetMetadataTitle("Login"),
  description: "Publicidade inteligente para negócios independentes",
};

export default function SignIn() {
  return <SignInForm />;
}
