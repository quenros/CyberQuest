import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NameEntry from "./pages/NameEntry";
import ChallengePage from "./pages/ChallengePage";

const queryClient = new QueryClient();

export default function App() {
  const [alias, setAlias] = useState(() => localStorage.getItem("alias") || "");

  return (
    <QueryClientProvider client={queryClient}>
      {alias ? (
        <ChallengePage alias={alias} />
      ) : (
        <NameEntry onEnter={setAlias} />
      )}
    </QueryClientProvider>
  );
}
