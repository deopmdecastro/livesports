import { redirect } from "next/navigation";

export default function AdminLiveNewPage() {
  redirect("/admin/lives?create=1");
}
