import Sidebar from "@/components/Sidebar";

export default function OfficerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col lg:flex-row bg-zinc-950 min-h-screen text-zinc-100">
            <Sidebar role="training_officer" />
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
