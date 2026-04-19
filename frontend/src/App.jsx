import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NameEntry from "./pages/NameEntry";
import Dashboard from "./pages/Dashboard";
import LearnPage from "./pages/LearnPage";
import ChallengePage from "./pages/ChallengePage";

const queryClient = new QueryClient();

export default function App() {
  const [alias, setAlias] = useState(() => localStorage.getItem("alias") || "");

  if (!alias) return <NameEntry onEnter={setAlias} />;

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard alias={alias} />} />
          <Route path="/learn/:topicId" element={<LearnPage alias={alias} />} />
          <Route path="/challenges/:topicId/:index" element={<ChallengePage alias={alias} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
