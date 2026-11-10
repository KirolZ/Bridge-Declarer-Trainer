import { describe, expect, it } from 'vitest';
import { isTestSite } from './testSite';

describe('isTestSite', () => {
  it('is true on Cloudflare Pages and on this machine', () => {
    expect(isTestSite('bridge-trainer.pages.dev')).toBe(true);
    expect(isTestSite('feature-test-site-notice.bridge-trainer.pages.dev')).toBe(true);
    expect(isTestSite('Bridge-Trainer.PAGES.dev.')).toBe(true);
    expect(isTestSite('localhost')).toBe(true);
    expect(isTestSite('127.0.0.1')).toBe(true);
  });

  it('is false on any other domain', () => {
    expect(isTestSite('bridgetrainer.com')).toBe(false);
    expect(isTestSite('www.bridge-trainer.app')).toBe(false);
    expect(isTestSite('pages.dev.example.com')).toBe(false);
    expect(isTestSite('mypages.dev')).toBe(false);
    expect(isTestSite('192.168.1.20')).toBe(false);
  });
});
