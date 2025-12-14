"use server"
import { cookies } from "next/headers";

export const token = async () => {
  const t = await cookies();

  return t.get("famtech-token");
};