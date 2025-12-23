"use server";

import { signIn } from "@/lib/auth";

// Inicia o fluxo de autenticação com Google
export async function loginWithGoogle() {
    await signIn("google", { redirectTo: "/dashboard" });
}