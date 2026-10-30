// Bug reports and feedback by email (SPEC §8): a mailto link with a subject and a starting body,
// so the player only has to describe the problem and the details that help find it come along.

/** Where players send bug reports and feedback. */
export const FEEDBACK_EMAIL = 'shinhiichi0@gmail.com';

export type FeedbackMail = {
  subject: string;
  /** Text the player fills in, before the details. */
  intro: string;
  /** Lines added under the player's text, such as the page and the browser. */
  details: readonly string[];
};

/**
 * `mailto:` link to {@link FEEDBACK_EMAIL}. Uses `encodeURIComponent` (not `URLSearchParams`)
 * because mail apps read `+` as a plus sign, not a space; line breaks are CRLF as RFC 6068 asks.
 */
export function feedbackMailto({ subject, intro, details }: FeedbackMail): string {
  const body = [intro, '', '', '---', ...details].join('\r\n');
  return (
    `mailto:${FEEDBACK_EMAIL}` +
    `?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  );
}
