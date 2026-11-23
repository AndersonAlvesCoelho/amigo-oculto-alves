"use server";

import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

export async function confirmarLink(formData: FormData) {
  const token_hash = String(formData.get("token_hash") ?? "");
  const type = String(formData.get("type") ?? "") as EmailOtpType;
  const code = String(formData.get("code") ?? "");

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Falha ao trocar código:", error.code, error.message);
      redirect("/auth/erro");
    }
    redirect("/");
  }

  if (!token_hash || !type) redirect("/auth/erro");

  const { error } = await supabase.auth.verifyOtp({ token_hash, type });
  if (error) {
    console.error("Falha ao confirmar link:", error.code, error.message);
    redirect("/auth/erro");
  }
  redirect("/");
}
