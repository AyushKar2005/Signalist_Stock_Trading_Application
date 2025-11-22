import Header from "@/components/Header";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Layout({
                                         children,
                                     }: {
    children: React.ReactNode;
}) {
    // await headers() so Next.js gives you a stable value to iterate
    const h = await headers();

    // If your auth lib expects a plain key/value object, make one:
    const hObj = Object.fromEntries(h.entries());

    const session = await auth.api.getSession({
        headers: hObj, // use hObj if auth expects a plain object; otherwise pass h
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


