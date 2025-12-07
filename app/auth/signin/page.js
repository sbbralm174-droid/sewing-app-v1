import { Suspense } from "react";
import SignIn from "./SignIn";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignIn />
    </Suspense>
  );
}
