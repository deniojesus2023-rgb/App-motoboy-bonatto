import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";

// Tipagem simplificada do router — espelha as procedures usadas pelo app do motoboy
// (não importamos o tipo real do servidor para evitar dependência de código Node.js)
export type AppRouter = any;

export const trpc = createTRPCReact<AppRouter>();

export function createTRPCClient(token?: string | null) {
  return trpc.createClient({
    transformer: superjson,
    links: [
      httpBatchLink({
        url: "https://bonatto.com.br/trpc",
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      }),
    ],
  });
}
