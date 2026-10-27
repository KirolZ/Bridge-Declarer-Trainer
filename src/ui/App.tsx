import { createHashRouter, RouterProvider } from 'react-router-dom';
import { DevSolverPage } from './pages/DevSolverPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';

// Hash routing (#/...) so dist/ can be served as static files from anywhere (SPEC §2).
const router = createHashRouter([
  { path: '/', element: <HomePage /> },
  { path: '/dev/solver', element: <DevSolverPage /> },
  { path: '*', element: <NotFoundPage /> },
]);

export function App() {
  return <RouterProvider router={router} />;
}
