import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/router";

export default function CleanerDashboard() {
  const [status, setStatus] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCleaner = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push("/login");
        return;
      }

      const cleanerDoc = await getDoc(doc(db, "cleaners", user.uid));
      if (!cleanerDoc.exists()) {
        router.push("/register");
        return;
      }

      const cleanerData = cleanerDoc.data();
      if (cleanerData?.status !== "approved") {
        setStatus("pending");
      } else {
        setStatus("approved");
      }
    };

    fetchCleaner();
  }, []);

  if (status === null) return <p>Loading...</p>;
  if (status === "pending") return <p>Your account is pending approval.</p>;

  return <div>Welcome to your dashboard!</div>;
}
