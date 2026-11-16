import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { AppState, Platform } from "react-native";
import { useState, useEffect } from "react";

/**
 * Where the API lives.
 *
 * An Android emulator cannot reach the host's "localhost" — 10.0.2.2 is the
 * host loopback from inside the emulator. A physical device needs the host's
 * LAN IP, which Expo already knows, so derive it from the dev server host
 * rather than making the developer hand-edit a constant.
 */
function resolveApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return configured;

  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(":")[0];

  if (host && host !== "localhost" && host !== "127.0.0.1") {
    return `http://${host}:4000`;
  }
  return Platform.OS === "android" ? "http://10.0.2.2:4000" : "http://localhost:4000";
}

export const API_BASE_URL = resolveApiBaseUrl();

// ─── Simple Session State ────────────────────────────────────────────────────

type SessionData = { user: { id: string; name: string; email: string } } | null;

let currentSession: SessionData = null;
let isPending = true;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

// Initialize from secure store
Promise.all([
  SecureStore.getItemAsync("finance.user").catch(() => null),
  SecureStore.getItemAsync("finance.access_token").catch(() => null),
]).then(([userStr, token]) => {
  if (userStr && token) {
    try {
      currentSession = { user: JSON.parse(userStr) };
    } catch {}
  }
  isPending = false;
  emit();
});

export function useSession() {
  const [state, setState] = useState({ data: currentSession, isPending });

  useEffect(() => {
    const listener = () => setState({ data: currentSession, isPending });
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return state;
}

export function getSessionToken(): string | null {
  return SecureStore.getItem("finance.access_token");
}

async function updateSession(user: any, access: string, refresh: string) {
  if (user && access) {
    await SecureStore.setItemAsync("finance.user", JSON.stringify(user));
    await SecureStore.setItemAsync("finance.access_token", access);
    if (refresh) await SecureStore.setItemAsync("finance.refresh_token", refresh);
    currentSession = { user };
  } else {
    await SecureStore.deleteItemAsync("finance.user");
    await SecureStore.deleteItemAsync("finance.access_token");
    await SecureStore.deleteItemAsync("finance.refresh_token");
    currentSession = null;
  }
  emit();
}

// ─── Token refresh ───────────────────────────────────────────────────────────

export type RefreshOutcome = "ok" | "rejected" | "offline";

let refreshInFlight: Promise<RefreshOutcome> | null = null;

/**
 * Swap the stored refresh token for a new pair. One shared call at a time: the
 * server rotates the refresh token, so two parallel refreshes would have the
 * second one rejected and sign the user out.
 *
 * "rejected" (the server said no) signs out. "offline" (no answer, or a 5xx /
 * 429) keeps the session: being in a tunnel is not a reason to lose it.
 */
export function refreshSession(): Promise<RefreshOutcome> {
  refreshInFlight ??= doRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function doRefresh(): Promise<RefreshOutcome> {
  const refreshToken = await SecureStore.getItemAsync("finance.refresh_token").catch(() => null);
  if (!refreshToken) {
    await updateSession(null, "", "");
    return "rejected";
  }
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    return "offline";
  }
  if (res.status === 401 || res.status === 422) {
    await updateSession(null, "", "");
    return "rejected";
  }
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok || !json.data?.accessToken || !json.data?.refreshToken) return "offline";
  await updateSession(json.data.user, json.data.accessToken, json.data.refreshToken);
  return "ok";
}

/** Seconds until the access token expires; 0 if there is none or it can't be read. */
function accessTokenSecondsLeft(): number {
  try {
    const payload = getSessionToken()?.split(".")[1];
    if (!payload) return 0;
    const { exp } = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return Math.max(0, exp - Date.now() / 1000);
  } catch {
    return 0;
  }
}

/** Refresh ahead of time when the token has under 5 minutes left. */
export async function refreshIfExpiring(): Promise<void> {
  if (currentSession && accessTokenSecondsLeft() < 300) await refreshSession();
}

// Coming back to the app after an hour should not start with a round of 401s.
AppState.addEventListener("change", (state) => {
  if (state === "active") void refreshIfExpiring();
});

// ─── Drop-in Replacements for Better Auth Actions ──────────────────────────

async function requestAuth(path: string, body: any) {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!json.ok) return { error: json.error };

    if (json.data?.accessToken) {
      await updateSession(json.data.user, json.data.accessToken, json.data.refreshToken);
    }
    return { data: json.data };
  } catch (e) {
    return { error: { message: "Can't reach the server. Check your connection." } };
  }
}

export const signIn = {
  email: (data: any) => requestAuth("/api/auth/sign-in", data),
};

export const signUp = {
  email: (data: any) => requestAuth("/api/auth/sign-up", data),
};

/** Emails a 6-digit code if the address has an account. The answer never says which. */
export const forgotPassword = (email: string) => requestAuth("/api/auth/forgot-password", { email });

/** Sets a new password with the emailed code; every device is signed out. */
export const resetPassword = (data: { email: string; code: string; password: string }) =>
  requestAuth("/api/auth/reset-password", data);

export const signOut = async () => {
  const token = getSessionToken();
  if (token) {
    await fetch(`${API_BASE_URL}/api/auth/sign-out`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }
  await updateSession(null, "", "");
};
