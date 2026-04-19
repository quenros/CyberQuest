import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useAuthStore from "./store/authStore";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

const queryClient = new QueryClient();

export default function App() {
  const token = useAuthStore((s) => s.token);

  return (
    <QueryClientProvider client={queryClient}>
      {token ? <Dashboard /> : <Login />}
    </QueryClientProvider>
  );
}
