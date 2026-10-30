import { describe, expect, it } from 'vitest';
import { FEEDBACK_EMAIL, feedbackMailto } from './feedback';

describe('feedbackMailto', () => {
  const link = feedbackMailto({
    subject: 'Bridge Declarer Trainer: แจ้งปัญหา & feedback',
    intro: 'เล่าปัญหาตรงนี้:',
    details: ['page: https://example.com/#/play?x=1+2', 'language: th'],
  });

  it('sends to the feedback address', () => {
    expect(FEEDBACK_EMAIL).toBe('shinhiichi0@gmail.com');
    expect(link.startsWith('mailto:shinhiichi0@gmail.com?subject=')).toBe(true);
  });

  it('encodes the subject and body so they come back unchanged', () => {
    const params = link.slice(link.indexOf('?') + 1).split('&');
    expect(params).toHaveLength(2);
    const [subject, body] = params.map((p) => decodeURIComponent(p.slice(p.indexOf('=') + 1)));
    expect(subject).toBe('Bridge Declarer Trainer: แจ้งปัญหา & feedback');
    expect(body).toBe(
      'เล่าปัญหาตรงนี้:\r\n\r\n\r\n---\r\npage: https://example.com/#/play?x=1+2\r\nlanguage: th',
    );
  });

  it('never uses + for spaces or leaves raw & / + in the values', () => {
    const query = link.slice(link.indexOf('?') + 1);
    expect(query).not.toContain('+');
    expect(query.split('&')).toHaveLength(2);
    expect(query).toContain('%20');
  });
});
