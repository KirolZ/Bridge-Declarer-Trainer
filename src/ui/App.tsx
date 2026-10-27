import { MotionConfig } from 'framer-motion';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { DevSolverPage } from './pages/DevSolverPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlayPage } from './pages/PlayPage';

// Hash routing (#/...) so dist/ can be served as static files from anywhere (SPEC §2).
const router = createHashRouter([
  { path: '/', element: <HomePage /> },
  { path: '/play/:code/:contract', element: <PlayPage /> },
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
