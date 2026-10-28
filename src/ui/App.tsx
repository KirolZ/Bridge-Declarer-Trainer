import { MotionConfig } from 'framer-motion';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { DevSolverPage } from './pages/DevSolverPage';
import { HomePage } from './pages/HomePage';
import { ExercisePage, GlossaryPage, LearnPage, LessonPage } from './pages/LearnPages';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlayPage } from './pages/PlayPage';
import { SettingsPage } from './pages/SettingsPage';
import { StatsPage } from './pages/StatsPage';

// Hash routing (#/...) so dist/ can be served as static files from anywhere (SPEC §2).
const router = createHashRouter([
  { path: '/', element: <HomePage /> },
  { path: '/play/:code/:contract', element: <PlayPage /> },
  { path: '/settings', element: <SettingsPage /> },
  { path: '/stats', element: <StatsPage /> },
  { path: '/learn', element: <LearnPage /> },
  { path: '/learn/glossary', element: <GlossaryPage /> },
  { path: '/learn/ex/:id', element: <ExercisePage /> },
  { path: '/learn/:chapter', element: <LessonPage /> },
  { path: '/dev/solver', element: <DevSolverPage /> },
  { path: '*', element: <NotFoundPage /> },
]);

export function App() {
  return (
    // Animations follow the system "reduce motion" setting.
    <MotionConfig reducedMotion="user">
      <RouterProvider router={router} />
    </MotionConfig>
  );
}
