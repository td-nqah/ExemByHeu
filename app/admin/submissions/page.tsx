import { redirect } from "next/navigation";

export default function AdminSubmissionsRedirectPage() {
  redirect("/admin/history");
}
