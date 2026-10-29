import { Link } from 'react-router-dom';
import { useT } from '../gameStore';

export function NotFoundPage() {
  const t = useT();
  return (
    <main className="mx-auto flex min-h-full max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">{t.common.notFound}</h1>
      <Link to="/" className="rounded-lg bg-white/10 px-4 py-2 hover:bg-white/20">
        {t.common.backHome}
      </Link>
    </main>
  );
}
