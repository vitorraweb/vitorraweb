"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/* The Users screen is now the richer Staff directory. Keep this path working
   for old links/bookmarks by redirecting. */
export default function UsersRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/admin/staff"); }, [router]);
  return null;
}
