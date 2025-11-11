import Header from "@/components/Header";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Layout({
                                         children,
                                     }: {
    children: React.ReactNode;
}) {
    // headers() is synchronous
    const h = headers();

    // Many auth libs want plain key/value headers; if yours does, uncomment:
    // const hObj = Object.fromEntries(h.entries());

    const session = await auth.api.getSession({
        headers: h, // or hObj if your auth expects a plain object
    });

    if (!session?.user) {
        redirect("/sign-in");
    }

    const user = {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
    };

    return (
        <main className="min-h-screen text-gray-400">
            <Header user={user} />
            <div className="container py-10">{children}</div>
        </main>
    );
}
