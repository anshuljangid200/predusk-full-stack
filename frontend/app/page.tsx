import UploadZone from '@/components/UploadZone';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-24 relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <div className="absolute inset-0 z-0 bg-grid-slate-100/[0.04] bg-[bottom_1px_center] pointer-events-none" />
      
      <div className="z-10 w-full max-w-4xl flex flex-col items-center">
        <div className="mb-12 text-center space-y-4">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700 pb-2">
            Intelligent Document Processing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-medium">
            Extract text, keywords, and metadata asynchronously using Celery & Redis.
          </p>
        </div>

        <UploadZone />

        <div className="mt-10 text-center">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 font-semibold transition-colors underline-offset-4 hover:underline">
            View Processing Dashboard →
          </Link>
        </div>
      </div>
    </main>
  );
}
