import { Suspense } from "react";
import SuccessClient from "./SuccessClient";

export default function SuccessPage() {
  return (
    <Suspense fallback={<p className="text-center">Loading...</p>}>
      <SuccessClient />
    </Suspense>
  );
}
