export default function Footer() {
    return (
        <footer className="bg-white">
            <div className="h-px w-full bg-slate-200" />
            <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
                <p className="text-xs text-slate-500">
                    © {new Date().getFullYear()} University of Makeni — UNIMAK Voting System
                </p>
                <p className="text-xs text-slate-500">
                    SRC & Department Elections
                </p>
            </div>
            <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700" />
        </footer>
    );
}
