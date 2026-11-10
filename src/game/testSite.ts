// The "this is a test site" notice on the home page (SPEC §8). The app is hosted on a temporary
// address for now and will move to its own domain later; the notice shows only on test hosts, so
// the future domain never shows it and no code has to change on the move.

/** Hosts that are test sites: Cloudflare Pages (production and branch previews) and this machine. */
export function isTestSite(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === 'pages.dev' ||
    host.endsWith('.pages.dev')
  );
}
