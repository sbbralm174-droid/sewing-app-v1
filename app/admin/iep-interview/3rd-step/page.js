export const dynamic = "force-dynamic";

import { Suspense } from "react";
import VivaInterviewClient from "./viva-client";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VivaInterviewClient />
    </Suspense>
  );
}
