// This layout ensures the login page doesn't use the admin layout
// The AdminLayoutWrapper will also check and skip the admin UI for this page
export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

