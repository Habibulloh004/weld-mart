import { cookies } from "next/headers";
import Header from "./_components/Header";
import Sidebar from "./_components/Sidebar";
import { AdminSocketProvider } from "@/context/AdmnSocketContext";

export default async function AdminLayout({ children }) {
  let auth = null;
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("adminAuth");

  if (authCookie) {
    try {
      auth = JSON.parse(authCookie.value);
    } catch (error) {
      console.error("Invalid auth cookie:", error);
    }
  }

  return (
    <AdminSocketProvider>
      <div className="flex flex-col min-h-screen">
        <Header authData={auth} />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6 bg-muted/40 overflow-y-auto ml-64 mt-16">
            {children}
          </main>
        </div>
      </div>
    </AdminSocketProvider>
  );
}
