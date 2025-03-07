import { Suspense } from "react";

export default function FullWidthPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <div>{children}</div>
    </Suspense>
  );
}
