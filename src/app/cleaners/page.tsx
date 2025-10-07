// /app/cleaners/page.tsx
import { Suspense } from "react";
import CleanersClient from "./CleanersClient";

export default function CleanersPage() {
  return (
    <Suspense fallback={<p className="text-center">Loading cleaners...</p>}>
      <CleanersClient />
    </Suspense>
  );
}
