import Head from 'next/head';
import Link from 'next/link';

export default function Layout({ children }) {
  return (
    <>
      <Head>
        <title>Garment Sewing Management</title>
        <meta name="description" content="Garment Sewing Management System" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow">
          <div className="container mx-auto px-4 py-3">
            <div className="flex justify-between">
              <div className="flex space-x-4">
                <Link href="/">
                  <span className="font-bold text-xl">GSM</span>
                </Link>
              </div>
              <div className="flex space-x-4">
                <Link href="/floors">
                  <span className="px-3 py-2">Floors</span>
                </Link>
                <Link href="/lines">
                  <span className="px-3 py-2">Lines</span>
                </Link>
                <Link href="/machine-types">
                  <span className="px-3 py-2">Machine Types</span>
                </Link>
                <Link href="/machines">
                  <span className="px-3 py-2">Machines</span>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    </>
  );
}