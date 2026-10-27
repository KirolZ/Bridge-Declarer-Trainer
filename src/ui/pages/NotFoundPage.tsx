import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-full max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">ไม่พบหน้านี้</h1>
      <Link to="/" className="rounded-lg bg-white/10 px-4 py-2 hover:bg-white/20">
        กลับหน้าแรก
      </Link>
    </main>
  );
}
