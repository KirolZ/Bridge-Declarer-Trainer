// The beginner's guide (SPEC §7.7): #/learn (chapters + progress), #/learn/<n> (a lesson),
// #/learn/ex/<id> (an exercise) and #/learn/glossary[?t=<term>].

import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import type { Chapter, Exercise } from '../../learn';
import {
  CHAPTERS,
  EXERCISES,
  chapterOf,
  chaptersIn,
  exerciseById,
  exercisesOf,
  glossaryIn,
} from '../../learn';
import { learnStore, useLanguage, useLearn, useT } from '../gameStore';
import { Blocks } from '../learn/examples';
import { AnswerExerciseView, LegalExerciseView, PRIMARY, SECONDARY } from '../learn/ExerciseViews';
import { PlayExerciseView } from '../learn/PlayExerciseView';
import { Rich, TermSheetProvider } from '../learn/Rich';
import { NotSavedNotice, PageHeader } from './PageHeader';

const TOTAL = CHAPTERS.length;

const BACK_CLASS =
  'grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 text-lg hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none';

/** Header with a fixed way back (the guide's pages link to each other, not to history). */
function LearnHeader({
  back,
  backLabel,
  kicker,
  title,
}: {
  back: string;
  backLabel: string;
  kicker?: string;
  title: ReactNode;
}) {
  return (
    <header className="flex items-center gap-3 py-4">
      <Link to={back} aria-label={backLabel} className={BACK_CLASS}>
        ←
      </Link>
      <div className="flex min-w-0 flex-col">
        {kicker && <span className="text-sm text-white/60">{kicker}</span>}
        <h1 className="text-2xl leading-tight font-bold">{title}</h1>
      </div>
    </header>
  );
}

function NotFound({ what }: { what: string }) {
  const t = useT();
  return (
    <main className="mx-auto flex min-h-full max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">{t.learn.notFound(what)}</h1>
      <Link to="/learn" className={SECONDARY}>
        {t.learn.toGuide}
      </Link>
    </main>
  );
}

function passedCount(exercises: readonly Exercise[], passed: readonly string[]): number {
  return exercises.filter((e) => passed.includes(e.id)).length;
}

// ---------- #/learn ----------

export function LearnPage() {
  const progress = useLearn((s) => s.progress);
  const persistent = useLearn((s) => s.persistent);
  const read = progress.read.filter((n) => chapterOf(n)).length;
  const passed = passedCount(EXERCISES, progress.passed);
  const t = useT();
  const lang = useLanguage();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 pb-8">
      <PageHeader title={t.common.guide} to="/" />
      {!persistent && <NotSavedNotice what={t.learn.progressWhat} />}
      <section
        className="flex flex-col gap-2 rounded-2xl bg-black/25 p-4"
        aria-label={t.learn.progress}
      >
        <p data-testid="learn-progress">
          {t.learn.progressRead}{' '}
          <strong>
            {read}/{TOTAL}
          </strong>{' '}
          {t.learn.progressPassed}{' '}
          <strong>
            {passed}/{EXERCISES.length}
          </strong>{' '}
          {t.learn.progressEnd}
        </p>
        <div
          className="h-2 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-label={t.learn.chaptersRead}
          aria-valuemin={0}
          aria-valuemax={TOTAL}
          aria-valuenow={read}
        >
          <div
            className="h-full rounded-full bg-amber-400"
            style={{ width: `${(read / TOTAL) * 100}%` }}
          />
        </div>
        <p className="text-sm text-white/70">{t.learn.readInOrder}</p>
      </section>

      <ol className="flex flex-col gap-2">
        {chaptersIn(lang).map((c) => (
          <ChapterItem
            key={c.n}
            chapter={c}
            read={progress.read.includes(c.n)}
            passed={progress.passed}
          />
        ))}
      </ol>
      <Link
        to="/learn/glossary"
        className="rounded-2xl bg-black/25 px-4 py-3 hover:bg-black/40 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
      >
        <span className="font-semibold">{t.learn.glossary}</span>
        <span className="block text-sm text-white/70">{t.learn.glossaryNote}</span>
      </Link>
    </main>
  );
}

function ChapterItem({
  chapter,
  read,
  passed,
}: {
  chapter: Chapter;
  read: boolean;
  passed: readonly string[];
}) {
  const exercises = exercisesOf(chapter.n);
  const done = passedCount(exercises, passed);
  const written = chapter.blocks.length > 0;
  const t = useT();
  return (
    <li>
      <Link
        to={`/learn/${chapter.n}`}
        data-chapter={chapter.n}
        data-read={read || undefined}
        className="flex items-center gap-3 rounded-2xl bg-black/25 px-3 py-3 hover:bg-black/40 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
      >
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-full font-bold tabular-nums ${
            read ? 'bg-amber-400 text-black' : 'bg-white/10'
          }`}
          aria-hidden="true"
        >
          {read ? '✓' : chapter.n}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-semibold">
            <span className="sr-only">{t.learn.chapter(chapter.n)}: </span>
            {chapter.title}
          </span>
          <span className="truncate text-sm text-white/65">{chapter.topic}</span>
        </span>
        <span className="flex shrink-0 flex-col items-end text-xs text-white/70">
          {!written && <span className="rounded-full bg-white/10 px-2 py-0.5">{t.learn.soon}</span>}
          {read && <span className="text-amber-300">{t.learn.read}</span>}
          {exercises.length > 0 && (
            <span className={done === exercises.length ? 'text-emerald-300' : undefined}>
              {t.learn.exercisesDone(done, exercises.length)}
            </span>
          )}
        </span>
      </Link>
    </li>
  );
}

// ---------- #/learn/<n> ----------

/** Calls `onSeen` once the element has been on screen (reading to the end marks a chapter read). */
function useSeen(onSeen: () => void, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    if (typeof IntersectionObserver === 'undefined') {
      onSeen();
      return;
    }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        onSeen();
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [onSeen, enabled]);
  return ref;
}

export function LessonPage() {
  const { chapter: param = '' } = useParams();
  const lang = useLanguage();
  const chapter = /^\d+$/.test(param) ? chapterOf(Number(param), lang) : undefined;
  const progress = useLearn((s) => s.progress);
  const n = chapter?.n ?? 0;
  const written = (chapter?.blocks.length ?? 0) > 0;
  const markRead = useCallback(() => learnStore.getState().markRead(n), [n]);
  const end = useSeen(markRead, written);
  const t = useT();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [n]);

  if (!chapter) return <NotFound what={t.learn.thisChapter} />;
  const exercises = exercisesOf(n, lang);
  const prev = chapterOf(n - 1, lang);
  const next = chapterOf(n + 1, lang);

  return (
    <TermSheetProvider>
      <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 pb-24">
        <LearnHeader
          back="/learn"
          backLabel={t.learn.backToChapters}
          kicker={t.learn.chapterOf(n, TOTAL)}
          title={chapter.title}
        />
        {written ? (
          <article className="flex flex-col gap-3" data-testid="lesson">
            <Blocks blocks={chapter.blocks} />
          </article>
        ) : (
          <p className="rounded-2xl bg-black/25 p-4 text-white/80" data-testid="lesson-pending">
            {t.learn.pending(chapter.topic)}
          </p>
        )}
        <div
          ref={end}
          data-testid="lesson-end"
          data-read={progress.read.includes(n) || undefined}
        />

        {exercises.length > 0 && (
          <section aria-labelledby="exercises-title" className="flex flex-col gap-2">
            <h2 id="exercises-title" className="text-lg font-bold">
              {t.learn.exercises}
            </h2>
            <ol className="flex flex-col gap-2">
              {exercises.map((e, i) => {
                const ok = progress.passed.includes(e.id);
                return (
                  <li key={e.id}>
                    <Link
                      to={`/learn/ex/${e.id}`}
                      data-exercise={e.id}
                      data-passed={ok || undefined}
                      className="flex items-center gap-3 rounded-xl bg-black/25 px-3 py-2.5 hover:bg-black/40 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
                    >
                      <span
                        aria-hidden="true"
                        className={`grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold ${ok ? 'bg-emerald-400 text-black' : 'bg-white/10'}`}
                      >
                        {ok ? '✓' : i + 1}
                      </span>
                      <span className="flex-1">
                        <Rich text={e.title} />
                      </span>
                      <span className="text-xs text-white/60">
                        {ok ? t.learn.passed : t.learn.notDone}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        <nav aria-label={t.learn.lessons} className="mt-2 flex gap-2">
          {prev ? (
            <Link to={`/learn/${prev.n}`} className={`${SECONDARY} flex-1 text-left`}>
              <span className="block text-xs text-white/60">{t.learn.prevChapter}</span>
              {prev.title}
            </Link>
          ) : (
            <span className="flex-1" />
          )}
          {next ? (
            <Link to={`/learn/${next.n}`} className={`${SECONDARY} flex-1 text-right`}>
              <span className="block text-xs text-white/60">{t.learn.nextChapter}</span>
              {next.title}
            </Link>
          ) : (
            <Link to="/learn" className={`${SECONDARY} flex-1 text-right`}>
              {t.learn.backToChapters}
            </Link>
          )}
        </nav>
      </main>
    </TermSheetProvider>
  );
}

// ---------- #/learn/ex/<id> ----------

function ExerciseBody({ ex, onPass }: { ex: Exercise; onPass: () => void }) {
  switch (ex.kind) {
    case 'legal':
      return <LegalExerciseView ex={ex} onPass={onPass} />;
    case 'winner':
    case 'choice':
      return <AnswerExerciseView ex={ex} onPass={onPass} />;
    case 'play':
      return <PlayExerciseView ex={ex} onPass={onPass} />;
  }
}

export function ExercisePage() {
  const { id = '' } = useParams();
  const lang = useLanguage();
  const ex = exerciseById(id, lang);
  const passed = useLearn((s) => s.progress.passed.includes(id));
  const [hint, setHint] = useState(false);
  const onPass = useCallback(() => learnStore.getState().markPassed(id), [id]);
  const t = useT();

  useEffect(() => {
    setHint(false);
    window.scrollTo(0, 0);
  }, [id]);

  if (!ex) return <NotFound what={t.learn.thisExercise} />;
  const siblings = exercisesOf(ex.chapter);
  const i = siblings.findIndex((e) => e.id === ex.id);
  const next = siblings[i + 1];
  const nextChapter = chapterOf(ex.chapter + 1);

  return (
    <TermSheetProvider>
      <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 pb-24">
        <LearnHeader
          back={`/learn/${ex.chapter}`}
          backLabel={t.learn.backToChapter(ex.chapter)}
          kicker={t.learn.exerciseOf(ex.chapter, i + 1, siblings.length)}
          title={<Rich text={ex.title} />}
        />
        <section className="rounded-2xl bg-black/25 p-4 leading-relaxed" data-testid="instruction">
          <Rich text={ex.instruction} />
          <div className="mt-2">
            {hint ? (
              <p className="text-sm text-sky-200" data-testid="hint">
                {t.learn.hint} <Rich text={ex.hint} />
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setHint(true)}
                className="text-sm text-sky-200 underline underline-offset-4 hover:text-sky-100"
              >
                {t.learn.askHint}
              </button>
            )}
          </div>
        </section>

        <ExerciseBody key={ex.id} ex={ex} onPass={onPass} />

        <nav
          aria-label={t.learn.exercises}
          className="mt-2 flex flex-wrap gap-2"
          data-passed={passed || undefined}
        >
          <Link to={`/learn/${ex.chapter}`} className={`${SECONDARY} flex-1 text-center`}>
            {t.learn.backToChapter(ex.chapter)}
          </Link>
          {next ? (
            <Link
              to={`/learn/ex/${next.id}`}
              className={`${passed ? PRIMARY : SECONDARY} flex-1 text-center`}
            >
              {t.learn.nextExercise}
            </Link>
          ) : (
            nextChapter && (
              <Link
                to={`/learn/${nextChapter.n}`}
                className={`${passed ? PRIMARY : SECONDARY} flex-1 text-center`}
              >
                {t.learn.toChapter(nextChapter.n)}
              </Link>
            )
          )}
        </nav>
      </main>
    </TermSheetProvider>
  );
}

// ---------- #/learn/glossary ----------

export function GlossaryPage() {
  const [params] = useSearchParams();
  const focus = params.get('t');
  const t = useT();
  const lang = useLanguage();

  useEffect(() => {
    if (!focus) return;
    document.getElementById(`term-${focus}`)?.scrollIntoView({ block: 'center' });
  }, [focus]);

  return (
    <TermSheetProvider>
      <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 pb-24">
        <LearnHeader back="/learn" backLabel={t.learn.backToGuide} title={t.learn.glossary} />
        <p className="text-white/75">{t.learn.glossaryIntro}</p>
        <dl className="flex flex-col gap-2">
          {glossaryIn(lang).map((e) => (
            <div
              key={e.id}
              id={`term-${e.id}`}
              data-term-entry={e.id}
              data-focus={focus === e.id || undefined}
              className={`scroll-mt-4 rounded-xl px-3 py-2.5 ${focus === e.id ? 'bg-amber-300/15 ring-2 ring-amber-300' : 'bg-black/25'}`}
            >
              <dt className="font-bold">
                {e.term}
                {lang === 'th' && <span className="font-normal text-white/70"> ({e.thai})</span>}
                {e.aliases && (
                  <span className="block text-sm font-normal text-white/60">
                    {t.learn.related} {e.aliases.join(', ')}
                  </span>
                )}
              </dt>
              <dd className="leading-relaxed text-white/90">
                <Rich text={e.text} />
                {e.chapter !== undefined && (
                  <Link
                    to={`/learn/${e.chapter}`}
                    className="ml-2 text-sm whitespace-nowrap text-amber-200 hover:underline"
                  >
                    {t.learn.chapter(e.chapter)}
                  </Link>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </main>
    </TermSheetProvider>
  );
}
