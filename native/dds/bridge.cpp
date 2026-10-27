// C entry points over DDS for the trainer's WebAssembly build (scripts/build-dds.sh).
//
// Everything crosses the boundary as flat int arrays, in DDS's own encodings:
//   hand  0..3 = N, E, S, W
//   suit  0..3 = S, H, D, C   (strain 4 = NT)
//   rank  2..14, and a holding is a bitmask with bit `rank` set per card (A = 1 << 14)

#include <api/calc_dd_table.hpp>
#include <api/dds.h>
#include <api/solve_board.hpp>

#include <emscripten.h>

namespace {

// Small TT (20 MB, up to 30 MB) as in DDS's own web build: keeps the Worker's memory modest.
auto config() -> SolverConfig
{
  return SolverConfig{
      .tt_kind_ = TTKind::Small,
      .tt_mem_default_mb_ = THREADMEM_SMALL_DEF_MB,
      .tt_mem_maximum_mb_ = THREADMEM_SMALL_MAX_MB,
  };
}

// One context for play (solve / analyze), one for tables, so neither evicts the other.
// The play context keeps its TT between calls: positions from the same deal reuse earlier work
// (SPEC §5.5). DDS itself resets the TT when the holdings no longer look like the same deal or
// the trump suit changes (solver_if.cpp), and bt_reset_play() clears it on request.
auto play_context() -> SolverContext&
{
  static SolverContext ctx(config());
  return ctx;
}

auto table_context() -> SolverContext&
{
  static SolverContext ctx(config());
  return ctx;
}

// True when DDS's `equals` holding (stored shifted left by 2) lists `rank`.
auto equals_has(int equals, int rank) -> bool
{
  return ((static_cast<unsigned>(equals) >> 2) & (1u << (rank - 2))) != 0;
}

}  // namespace

extern "C" {

// in[24]: trump, first (leader of the current trick), trick suits[3], trick ranks[3]
//         (0 when not played), then holdings[hand * 4 + suit].
// solutions: 1 = best score only, 3 = every legal card.
// out: out[0] = n, then n (suit, rank, score) triples, one per card (DDS groups of equal
//      cards are expanded), score = tricks for the side to play. Needs 1 + 13 * 3 ints.
// Returns 1 on success, otherwise a DDS error code (negative).
EMSCRIPTEN_KEEPALIVE
auto bt_solve(const int* in, int solutions, int* out) -> int
{
  Deal dl{};
  dl.trump = in[0];
  dl.first = in[1];
  for (int i = 0; i < 3; ++i) {
    dl.currentTrickSuit[i] = in[2 + i];
    dl.currentTrickRank[i] = in[5 + i];
  }
  for (int h = 0; h < DDS_HANDS; ++h) {
    for (int s = 0; s < DDS_SUITS; ++s) {
      dl.remainCards[h][s] = static_cast<unsigned>(in[8 + h * 4 + s]);
    }
  }

  FutureTricks fut{};
  // mode 1: always search, even when only one card can be played.
  const int res = solve_board(play_context(), dl, /*target=*/-1, solutions, /*mode=*/1, &fut);
  if (res != RETURN_NO_FAULT) {
    return res;
  }

  int n = 0;
  for (int i = 0; i < fut.cards && n < 13; ++i) {
    const int suit = fut.suit[i];
    const int top = fut.rank[i];
    const int score = fut.score[i];
    out[1 + 3 * n] = suit;
    out[2 + 3 * n] = top;
    out[3 + 3 * n] = score;
    ++n;
    for (int rank = 2; rank < top && n < 13; ++rank) {
      if (solutions != 3 || !equals_has(fut.equals[i], rank)) {
        continue;
      }
      out[1 + 3 * n] = suit;
      out[2 + 3 * n] = rank;
      out[3 + 3 * n] = score;
      ++n;
    }
  }
  out[0] = n;
  return RETURN_NO_FAULT;
}

// Forgets everything the play context has cached (call when moving on to a new deal).
EMSCRIPTEN_KEEPALIVE
auto bt_reset_play() -> void
{
  play_context().reset_for_solve();
}

// in[16]: holdings[hand * 4 + suit]. out[20]: tricks[strain * 4 + declarer].
// Returns 1 on success, otherwise a DDS error code (negative).
EMSCRIPTEN_KEEPALIVE
auto bt_calc_table(const int* in, int* out) -> int
{
  DdTableDeal deal{};
  for (int h = 0; h < DDS_HANDS; ++h) {
    for (int s = 0; s < DDS_SUITS; ++s) {
      deal.cards[h][s] = static_cast<unsigned>(in[h * 4 + s]);
    }
  }

  SolverContext& ctx = table_context();
  ctx.reset_for_solve();

  DdTableResults table{};
  const int res = calc_dd_table(ctx, deal, &table);
  if (res != RETURN_NO_FAULT) {
    return res;
  }
  for (int strain = 0; strain < DDS_STRAINS; ++strain) {
    for (int hand = 0; hand < DDS_HANDS; ++hand) {
      out[strain * 4 + hand] = table.res_table[strain][hand];
    }
  }
  return RETURN_NO_FAULT;
}

}  // extern "C"
