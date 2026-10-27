/* A role page sits in the page column, clear of the fixed site header. */
export default function RoleLayout({ children }: { children: React.ReactNode }) {
  return <div className="q-container pt-32 lg:pt-44 pb-20 md:pb-28">{children}</div>;
}
