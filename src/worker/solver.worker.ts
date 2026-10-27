// The solver Web Worker (SPEC §5.5): loads DDS once, then answers jobs one at a time, in order.

import { loadDds } from '../solver/dds';
import { SolverHost, errorMessage } from './host';
import type { SolverRequest, SolverResponse } from './protocol';

type Scope = {
  onmessage: ((event: MessageEvent<SolverRequest>) => void) | null;
  postMessage(message: SolverResponse): void;
};
const scope = self as unknown as Scope;

const host = loadDds().then((dds) => new SolverHost(dds));

scope.onmessage = ({ data: req }) => {
  // Callbacks on one promise run in the order they were added, so replies keep request order.
  void host
    .then(
      (h) => h.handle(req),
      (err): SolverResponse => ({
        id: req.id,
        ok: false,
        error: `solver failed to load: ${errorMessage(err)}`,
      }),
    )
    .then((res) => scope.postMessage(res));
};
