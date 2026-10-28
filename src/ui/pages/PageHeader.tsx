// Header of the plain pages (settings, stats): a back button and the title.

import { useNavigate } from 'react-router-dom';

/** Back to where the player came from (e.g. the table), or home when opened directly. */
function useBack(): () => void {
  const navigate = useNavigate();
  return () => {
    // React Router keeps its own history index; 0 = this page opened the app.
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate('/');
  };
}

/**
 * `to`: a fixed page to go back to. Without it, back goes to where the player came from — wrong
 * for pages that link to each other (the guide), where history would loop between them.
 */
export function PageHeader({ title, to }: { title: string; to?: string }) {
  const navigate = useNavigate();
  const historyBack = useBack();
  const back = to === undefined ? historyBack : () => navigate(to);
  return (
    <header className="flex items-center gap-3 py-4">
      <button
        type="button"
        onClick={back}
        aria-label="กลับ"
        className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 text-lg hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
      >
        ←
      </button>
      <h1 className="text-2xl font-bold">{title}</h1>
    </header>
  );
}

/** Shown when the browser blocks storage (SPEC §7.6): the app works, nothing is kept. */
export function NotSavedNotice({ what }: { what: string }) {
  return (
    <p
      role="status"
      data-testid="not-saved"
      className="rounded-lg bg-amber-300 px-3 py-2 text-sm text-black"
    >
      เบราว์เซอร์นี้ไม่ให้บันทึกข้อมูล — {what}ใช้ได้ตามปกติ แต่จะหายเมื่อปิดหรือรีเฟรชหน้า
    </p>
  );
}
