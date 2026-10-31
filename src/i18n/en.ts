// English text of every screen: the same keys as th.ts (typed as `Messages`). Standard bridge
// English; the guide's markup ([[term]], {SA}, **bold**) works the same in both languages.

import { SUIT_INFO, rankLabel } from '../engine';
import type { Seat } from '../engine';
import type { Messages } from './th';

const SEAT: Readonly<Record<Seat, string>> = { N: 'North', E: 'East', S: 'South', W: 'West' };

const CONTRACT_TYPE = {
  any: 'Any',
  gameUp: 'Game or higher',
  slam: 'Slam',
  nt: 'NT only',
  suit: 'Suit only',
  noSlam: 'Partscore / game',
};

const BEGINNER_ON = 'Beginner mode is on';

/** "1 trick", "3 tricks". */
const tricks = (n: number) => `${n} trick${n === 1 ? '' : 's'}`;
const times = (n: number) => (n === 1 ? 'once' : `${n} times`);

export const en: Messages = {
  common: {
    back: 'Back',
    backHome: 'Back to home',
    home: 'Home',
    cancel: 'Cancel',
    retry: 'Try again',
    close: 'Close',
    settings: 'Settings',
    stats: 'Stats',
    guide: 'Guide',
    language: 'Language',
    notSaved: (what) =>
      `This browser does not allow saving — everything works, but your ${what} will be lost when you close or reload the page`,
    notFound: 'Page not found',
    badHandLink: 'This hand link is not valid',
  },

  seatRole: { N: 'North (dummy)', E: 'East', S: 'South (you)', W: 'West' },
  suitName: {
    S: SUIT_INFO.S.name,
    H: SUIT_INFO.H.name,
    D: SUIT_INFO.D.name,
    C: SUIT_INFO.C.name,
  },
  cardName: (card) => `${rankLabel(card.rank)} of ${SUIT_INFO[card.suit].name}`,
  or: ' or ',
  illegal: (reason, owner) => {
    switch (reason.code) {
      case 'must-follow-suit': {
        const s = SUIT_INFO[reason.suit].symbol;
        if (owner === 'S') return `You must play ${s}: you still have ${s}`;
        if (owner === 'N') return `You must play ${s}: dummy still has ${s}`;
        return `You must play ${s} while the hand still has ${s}`;
      }
      case 'not-in-hand':
        if (reason.seat === 'N') return "It's dummy's turn — tap one of North's cards at the top";
        if (reason.seat === 'S') return "It's your turn — tap a card from South's hand below";
        return `That is not ${SEAT[reason.seat]}'s card`;
      case 'hand-complete':
        return 'All the tricks have been played';
    }
  },
  vulnerability: { none: 'Nobody vul', ns: 'NS vul' },
  contractType: CONTRACT_TYPE,
  storeMessage: (m) => {
    switch (m.kind) {
      case 'botFailed':
        return `The bot could not play (${m.detail})`;
      case 'hintFailed':
        return `The hint failed (${m.detail})`;
      case 'claimFailed':
        return `The claim could not be checked (${m.detail})`;
      case 'dealFailed':
        return `Dealing failed (${m.detail})`;
      case 'dealRelaxed':
        return (
          `No "${CONTRACT_TYPE[m.wanted]}" hand came up in 30 deals, ` +
          `so this is a "${CONTRACT_TYPE[m.got]}" hand instead`
        );
    }
  },

  home: {
    tagline: 'Practise declarer play against bots that see all four hands',
    welcomeTitle: 'Have you played bridge before?',
    welcomeNew: 'Not yet',
    welcomeNewNote: 'Start with the guide + beginner mode',
    welcomeKnown: 'Yes, I have',
    welcomeKnownNote: 'Start playing',
    welcomeLater:
      'You can change your mind any time: the guide is on this page, beginner mode is in Settings',
    play: 'Play',
    mainMenu: 'Main menu',
    chapters: (read, total) => `${read}/${total} chapters`,
    creditsBy: 'by Bo Haglund, Soren Hein et al.',
    feedbackOpen: 'Contact',
    feedbackTitle: 'Report a bug / feedback',
    feedbackNote: 'Found a bug, or want something added? Send it over.',
    feedbackEmail: "Developer's email",
    feedbackCopy: 'Copy',
    feedbackCopied: '✓ Copied',
    feedbackCopiedStatus: 'Email address copied',
    feedbackCopyFailed: 'Could not copy. The address is selected: copy it yourself.',
    feedbackSend: 'Send email',
    feedbackSubject: 'Bridge Declarer Trainer: bug report / feedback',
    feedbackIntro:
      'Tell us about the problem or your idea here (for a bug, say what you did just before it, and attach a screenshot if you can):',
  },

  dealing: 'Dealing…',

  settings: {
    notSavedWhat: 'settings',
    beginner: 'Beginner mode',
    beginnerNote:
      'Easy contracts (with a cushion, no slams), slow bots, a reason when you tap a card you cannot play, tips on the table, and the score explained part by part at the end',
    locked: (why) => `${BEGINNER_ON}: ${why}`,
    dealSection: 'Dealing (from the next hand)',
    contractType: 'Contract type',
    contractTypeLocked: 'partscore or game only, no slams',
    difficulty: 'Difficulty',
    difficultyLocked: 'always with a cushion',
    difficultyOptions: {
      exact: { label: 'Exact', note: 'The most the hand can make — every card has to be right' },
      cushion: {
        label: 'Cushion',
        note: 'One level below the most (when possible) — one trick to spare',
      },
    },
    vulnerability: 'Vulnerability',
    vulnerabilityOptions: {
      none: { label: 'Not vul' },
      ns: { label: 'NS vul', note: 'More points when you make it, more lost when you go down' },
    },
    playSection: 'While playing',
    cardPlay: 'Playing a card',
    cardPlayOptions: {
      tap: { label: 'Tap to play', note: 'One tap plays the card at once' },
      confirm: {
        label: 'Tap, then confirm',
        note: 'The first tap sends the card to wait in the middle of the table; tap it there (or the same card again) to play it, so a slip of the finger does no harm — tap elsewhere on the table or press Esc to cancel',
      },
    },
    botSpeed: 'Bot speed',
    botSpeedLocked: 'bots play slowly',
    botSpeedOptions: { slow: 'Slow', normal: 'Normal', fast: 'Fast' },
    suitOrder: 'Suit order',
    suitOrderOptions: {
      alternate: {
        label: 'Black / red',
        note: 'Trumps first, the way dummy is laid out at a real table',
      },
      rank: { label: '♠ ♥ ♦ ♣', note: 'Always the same order, whatever the contract' },
    },
    study: 'Study mode',
    studyNote:
      'Shows every hand while you play — a hand where this was on at any point does not count for the stats',
    saved: 'Changes are saved automatically',
    notSaved: 'Changes apply at once',
  },

  stats: {
    notSavedWhat: 'stats',
    empty: 'No stats yet — finish a hand first',
    kind: 'Type',
    hands: 'Hands',
    made: 'Made',
    lost: 'Tricks lost',
    hints: 'Hints',
    perHand: '/hand',
    all: 'All',
    suit: 'Suit',
    note: '"Tricks lost" is counted against best play (double dummy), as in the analysis after each hand · only the first time a hand is finished counts; undoing or playing the same hand again adds nothing · hands with study mode on do not count',
    reset: 'Clear stats',
    resetArmed: 'Press again to clear all stats',
  },

  table: {
    tools: 'Practice tools',
    hint: 'Hint',
    hintUsed: (n) => `Hint (used ${times(n)})`,
    thinking: 'Thinking…',
    undo: 'Undo',
    guideHere: 'Guide chapter for this moment',
    menu: 'Menu',
    restart: 'Play this hand again',
    newDeal: 'New deal',
    studyMode: 'Study mode (show all hands)',
    byDeclarer: 'by South',
    needed: (n) => `Need ${tricks(n)}`,
    seatThinking: 'Thinking',
    waitFor: (seat) => `Wait for ${SEAT[seat]} to play`,
    wonTrick: (seat) => `${SEAT[seat]} wins this trick`,
    confirmStatus: (card) => `Tap the card in the middle, or the ${card} again, to play it`,
    hintStatus: (n, needed) =>
      `Hint: the raised cards still make ${tricks(n)}${n < needed ? ` — not enough any more (need ${needed})` : ''}`,
    dummyTurn: "Dummy's turn — tap one of North's cards at the top",
    yourTurn: "Your turn — play a card from South's hand",
    botThinking: (seat) => `${SEAT[seat]} is thinking…`,
    played: (seat, card) => `${SEAT[seat]} played the ${card}`,
    tapToPlay: 'Tap to play',
    playCard: (card) => `Play the ${card}`,
    trickNumber: (n) => `Trick ${n}`,
    cardIllegal: ' (cannot be played)',
    cardPicked: ' (picked — press again to play)',
    cardHinted: ' (hint)',
    cardCount: (n) => `${n} card${n === 1 ? '' : 's'}`,
    noCards: 'no cards',
    dummyFaceDown: (n) => `Dummy still face down: ${n} card${n === 1 ? '' : 's'}`,
    tip: 'Tip',
    gotIt: 'Got it',
  },

  coach: {
    who: (seat) => (seat === 'S' ? 'you (South)' : seat === 'N' ? 'dummy (North)' : SEAT[seat]),
    contractNT: (level, needed) =>
      `The contract is ${level}NT — you need ${needed} [[trick|tricks]] and there are no [[trump|trumps]]: the highest card of the suit [[lead|led]] always wins`,
    contractSuit: (level, suit, needed) =>
      `The contract is ${level}${suit} — you need ${needed} [[trick|tricks]] with ${suit} as [[trump|trumps]]`,
    ruff: (trick, who, led, card) =>
      `Trick ${trick}: ${who} had no ${led}, so [[ruff|ruffed]] with ${card} — a [[trump]] beats every other suit, so it wins`,
    overruff: (trick, who, card) =>
      `Trick ${trick}: more than one player ruffed with a [[trump]]; ${card} from ${who} is the highest trump, so it wins (an [[overruff]])`,
    won: (trick, who, card, led) =>
      `Trick ${trick}: ${who} won with ${card} — the highest card of the suit [[lead|led]] (${led})`,
    discard: '. A card of another suit (a [[discard]]) cannot win',
    nextLead: (who) => ` · ${who} lead${who.startsWith('you') ? '' : 's'} to the next trick`,
    dummy:
      'North is [[dummy]] — the cards are face up for everyone, and **you choose** every card this hand plays',
    northTurn: "It's dummy's turn — tap one of **North's cards at the top**",
  },

  claim: {
    rejected: 'Claim refused — the defenders can still take tricks',
    goOnNote: 'Carry on playing from here',
    goOn: 'Play on',
    question: (left) =>
      `How many of the ${tricks(left)} left will you take? The app checks that you still get them against the best defence`,
    fewer: 'Fewer',
    more: 'More',
    total: (total, needed) =>
      `NS would take ${tricks(total)} in all (need ${needed}) · ${total >= needed ? 'contract made' : `${needed - total} down`}`,
    checking: 'Checking…',
    submit: (n) => `Claim ${tricks(n)}`,
  },

  share: {
    share: '🔗 Share this hand',
    copied: '✓ Link copied',
    copiedStatus: 'The link to this hand was copied',
    failed: 'Could not copy automatically — copy this link yourself',
  },

  result: {
    made: (contract) => `${contract} made!`,
    down: (contract, n) => `${contract} down ${n}`,
    tricks: (ns, dd, needed, over) =>
      `Took ${tricks(ns)}${dd !== null ? ` (DD makes ${dd})` : ''} · needed ${needed}${over > 0 ? ` · ${over} over` : ''}`,
    points: 'points',
    byClaim: 'Ended by a claim',
    hints: (n) => (n > 0 ? `Hints used: ${n}` : 'No hints used'),
    studied: 'Study mode (not in the stats)',
    scoreSource: 'Where the score comes from',
    total: 'Total',
    scoreChapter: 'Scoring (guide chapter 6)',
    lossPlayed: 'played',
    lossBetter: 'better:',
    lossClaim: (claimed, before) =>
      `Claimed ${tricks(claimed)} in all but ${before} could still be made · play on instead, e.g.`,
    reviewFailed: 'The analysis failed',
    reviewing: 'Analysing…',
    perfect: 'No tricks lost — every card was the best double-dummy play',
    lost: (n) => `${tricks(n)} lost against double-dummy`,
    trick: (n) => `Trick ${n}`,
    lossHelp: 'Tap an item to replay that trick',
    replay: '▶ Replay',
    undo: (claimed) => (claimed ? '↶ Undo the claim' : '↶ Undo the last card'),
  },

  score: {
    vul: (vulnerable) => (vulnerable ? 'vul' : 'not vul'),
    down: (n) => `Down ${n}`,
    downDetail: (n, per, vul) => `${n} × ${per} (${vul}: ${per} a trick)`,
    downSummary: (contract, needed, n) =>
      `${contract} needs ${tricks(needed)} but took ${n} — not made, so no points for the tricks, and the defenders score for every trick short`,
    contractTricks: (level) => `Contract tricks (${level} above 6)`,
    ntFirst: 'NT: first trick 40',
    ntMore: (more) => `NT: first trick 40 + ${more} × 30`,
    suitDetail: (level, per, suit) => `${level} × ${per} (${suit}: ${per} a trick)`,
    overtricks: (n) => `Overtricks: ${n}`,
    gameBonus: 'Game bonus',
    partscoreBonus: 'Partscore bonus',
    gameDetail: (vul, bonus) => `Contract tricks reach 100 · ${vul}: ${bonus}`,
    partscoreDetail: 'Contract tricks are under 100',
    slamBonus: (grand) => (grand ? 'Grand slam bonus' : 'Small slam bonus'),
    madeSummary: (contract, needed, n, over) =>
      `${contract} needs ${tricks(needed)} and took ${n} — made, so it scores the contract tricks${over ? ', the overtricks' : ''} and the bonus`,
  },

  replay: {
    legendPlayed: 'Played in this trick',
    legendWrong: 'Card that lost a trick',
    legendBetter: 'Card to play instead',
    back: 'Back to the summary',
    title: (trick, count) => `Replay · trick ${trick}/${count}`,
    pickTrick: 'Choose a trick',
    trick: (n, lossy) => `Trick ${n}${lossy ? ' (trick lost)' : ''}`,
    led: (seat) => `${SEAT[seat]} led`,
    ddBefore: (n) => `Before this trick DD makes ${n}`,
    claimHere: (n) => `Claimed here — NS take ${tricks(n)} in all`,
    lost: (n) => `${tricks(n)} lost: `,
    prev: '◀ Previous trick',
    next: 'Next trick ▶',
    playFromHere: 'Play again from here',
  },

  learn: {
    notFound: (what) => `${what} not found`,
    thisChapter: 'Chapter',
    thisExercise: 'Exercise',
    toGuide: 'Go to the guide',
    progressWhat: 'progress',
    progress: 'Progress',
    progressRead: 'Read',
    progressPassed: 'chapters · passed',
    progressEnd: 'exercises',
    chaptersRead: 'Chapters read',
    readInOrder: 'Read them in order, or skip to any chapter',
    glossary: 'Glossary',
    glossaryNote: 'Every bridge term with a short explanation',
    chapter: (n) => `Chapter ${n}`,
    chapterOf: (n, total) => `Chapter ${n} / ${total}`,
    soon: 'Coming soon',
    read: 'Read',
    exercisesDone: (done, total) => `Exercises ${done}/${total}`,
    partRead: (read, total) => `${read}/${total} read`,
    showPart: (n) => `Show ${n} chapters`,
    hidePart: 'Hide',
    rulesDone: 'You know the rules now — go and play',
    rulesDoneNote:
      'The playing technique in chapters 7–13 can wait until you have played a few hands. While you play, the ? button on the table opens the guide at any time.',
    backToChapters: 'Back to the chapters',
    pending: (topic) => `This chapter is not written yet — it will cover: ${topic}`,
    exercises: 'Exercises',
    passed: 'Passed',
    notDone: 'Not done yet',
    lessons: 'Lessons',
    prevChapter: '← Previous chapter',
    nextChapter: 'Next chapter →',
    backToChapter: (n) => `Back to chapter ${n}`,
    exerciseOf: (chapter, i, total) => `Chapter ${chapter} exercise · ${i}/${total}`,
    hint: 'Hint:',
    askHint: 'Show a hint',
    nextExercise: 'Next exercise →',
    toChapter: (n) => `Chapter ${n} →`,
    backToGuide: 'Back to the guide',
    glossaryIntro: 'Bridge terms in alphabetical order',
    related: 'Related:',
    allTerms: 'Whole glossary',
    pickChapter: 'Choose a chapter',
    closeGuide: 'Close the guide',
    openInGuide: 'Open in the guide (leaves the table)',
    led: (seat) => `${SEAT[seat]} leads`,
    wins: ' · wins',
    winsLabel: ' (wins)',
    toPlay: (seat) => `${SEAT[seat]}: to play`,
  },

  exercise: {
    hand: (role) => `Hand of ${role}`,
    pickCards: (role) => `${role} — tap the cards that can be played`,
    check: 'Check',
    right: 'Correct!',
    legalShown: 'Answer: the cards marked ✓ are the ones that can be played',
    wrong: 'Not quite',
    cannotPlay: 'cannot be played —',
    missed: 'can be played too, but is not picked',
    fixAndCheck: 'Change your picks and check again, or see the answer',
    showAnswer: 'Show the answer',
    options: 'Options',
    answer: 'Answer:',
    tryOther: 'Not that one — try another option',
    noTrump: 'No trumps (NT)',
    goal: 'Goal: NS take',
    goalOf: (total) => `of ${tricks(total)}`,
    northTurn: "North's (dummy) turn — tap a card at the top",
    southTurn: 'Your turn (South) — play a card from the hand below',
    solution: 'Answer',
    solutionFailed: 'The answer could not be loaded',
    solutionLoading: 'Preparing the answer…',
    backToPlay: 'Back to playing it yourself',
    solutionStep: (step, total) => `Answer — card ${step}/${total}`,
    stepHelp: 'Press "Next" to go card by card',
    solutionEnd: (n) => `Done: NS took ${tricks(n)}, the goal`,
    prev: '← Previous',
    next: 'Next →',
    playYourself: 'Play it yourself',
    retry: '↺ Try again',
    preparing: 'Setting up the table…',
    passed: (n) => `Passed! NS took ${tricks(n)}, the goal`,
    failed: (n, goal) => `Not yet — NS took ${tricks(n)} (goal ${goal})`,
    mistakeAt: (trick) => `The mistake was at trick ${trick}:`,
    reviewFailed: 'Could not find the mistake',
    reviewing: 'Looking for the mistake…',
  },
};
