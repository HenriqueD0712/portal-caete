"use server";

import { createClient } from "@/src/lib/supabase/server";
import { REMEMBER_COOKIE } from "@/src/lib/supabase/cookies";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(_prevState: unknown, formData: FormData) {
  // Checkbox "Lembrar de mim": presente no formData só quando marcado.
  const remember = formData.get("remember") != null;
  const cookieStore = await cookies();
  cookieStore.set(REMEMBER_COOKIE, remember ? "1" : "0", {
    path: "/",
    sameSite: "lax",
    // Marcado: preferência dura ~13 meses. Desmarcado: cookie de sessão.
    ...(remember ? { maxAge: 60 * 60 * 24 * 400 } : {}),
  });

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });
  if (error) return { error: "E-mail ou senha incorretos." };
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
