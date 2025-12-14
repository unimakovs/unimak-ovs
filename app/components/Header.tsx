export default function Header() {
    return (
        <header className="bg-white">
            {/* top accent bar in blue */}
            <div className="h-1 w-full bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500" />

            <div className="mx-auto max-w-6xl px-4">
                <div className="py-4 flex items-center justify-between">
                    {/* Not clickable */}
                    <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold shadow-sm">
              U
            </span>
                        <div className="leading-tight">
                            <div className="font-semibold text-slate-900 tracking-tight">
                                UNIMAK Voting System
                            </div>
                            <div className="text-xs text-slate-500">
                                University of Makeni · Secure Elections
                            </div>
                        </div>
                    </div>

                    <div className="text-xs text-slate-500">
                        Admin Portal
                    </div>
                </div>
            </div>

            <div className="h-px w-full bg-slate-200" />
        </header>
    );
}
