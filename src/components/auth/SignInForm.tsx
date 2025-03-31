"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import React, { useState } from "react";
import { signIn } from "next-auth/react";
// import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import { IToastType } from "@/interfaces/general";
import { GetErrorMessage } from "@/utils/generic";
import Spinner from "../ui/spinner/Spinner";
import { useDynamicForm } from "@/utils/form";

interface ILoginForm {
  email: string;
  password: string;
}

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  // const [isChecked, setIsChecked] = useState(false);
  // const router = useRouter();
  const { showToast } = useToast();
  const { formData, handleChange } = useDynamicForm<ILoginForm>({
    email: "",
    password: "",
  });

  const [loadingSubmit, setLoadingSubmit] = useState(false);
  function updateForm(column: keyof ILoginForm, value: string) {
    handleChange(column, value);
  }

  const validateLoginForm = (formData: ILoginForm): boolean => {
    const { email, password } = formData;
    let isValid = true;

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      showToast("Por favor, insira seu e-mail", IToastType.ERROR);
      isValid = false;
    } else if (!emailRegex.test(email)) {
      showToast("Por favor, insira um e-mail válido", IToastType.ERROR);
      isValid = false;
    }

    // Validação de senha
    if (!password) {
      showToast("Por favor, insira sua senha", IToastType.ERROR);
      isValid = false;
    } else if (password.length < 6) {
      showToast("A senha deve ter pelo menos 6 caracteres", IToastType.ERROR);
      isValid = false;
    } else if (password.length > 20) {
      showToast("A senha não pode ter mais de 20 caracteres", IToastType.ERROR);
      isValid = false;
    }

    return isValid;
  };

  async function onSubmit() {
    const isValid = validateLoginForm(formData);
    if (!isValid) return;

    try {
      setLoadingSubmit(true);
      const response = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (response?.error) {
        showToast(response?.error, IToastType.ERROR);
      } else if (response?.ok) {
        // router.push("/home");
        window.location.href = "/home";
      }
    } catch (e: unknown) {
      showToast(GetErrorMessage(e), IToastType.ERROR);
    } finally {
      setLoadingSubmit(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      {/* <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Back to dashboard
        </Link>
      </div> */}
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign in!
            </p>
          </div>
          <div>
            {/* <Form {...form}> */}
            <div className="space-y-6">
              <div>
                <Label>
                  Email <span className="text-error-500">*</span>
                </Label>
                <Input
                  value={formData.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                />
              </div>
              <div>
                <Label>
                  Password <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => updateForm("password", e.target.value)}
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                    )}
                  </span>
                </div>
              </div>
              {/* <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox checked={isChecked} onChange={setIsChecked} />
                  <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                    Keep me logged in
                  </span>
                </div>
                <Link
                  href="/reset-password"
                  className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Forgot password?
                </Link>
              </div> */}
              <div className="text-center">
                {loadingSubmit ? (
                  <Spinner color="#465fff" />
                ) : (
                  <Button className="w-full" size="sm" onClick={onSubmit}>
                    Sign in
                  </Button>
                )}
              </div>
            </div>
            {/* </Form> */}

            {/* <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Don&apos;t have an account? {""}
                <Link
                  href="/signup"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign Up
                </Link>
              </p>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}
