
export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}