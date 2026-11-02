import { randomUUID } from "expo-crypto";
import { useLocalSessions, type LocalSessions } from "@sendtally/features/log-session";
import { useApi } from "./api";

export function useSessions(): LocalSessions {
  return useLocalSessions(useApi(), randomUUID);
}
