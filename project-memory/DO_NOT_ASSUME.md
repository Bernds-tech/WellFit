# WellFit Do Not Assume

Revalidate before relying on:
- current branch/commit/deploy/preview state;
- that a tracked memory file containing an old branch-tip SHA still describes the live branch;
- that a visual change is accepted merely because code exists;
- that web/backend or native AR work belongs in this repository;
- that an old screenshot/design decision still reflects current approved UI;
- that a historical TODO overrides the current repository state.

Mutable Git refs (`main`, feature branches, PR heads) must be queried live during preflight. Store exact SHAs in memory only when they identify immutable evidence such as a merge commit, reviewed exact head or accepted snapshot—not as a static claim that a mutable branch is still current.

When work depends on a drift-prone fact, record the revalidation in `EVIDENCE.md`, `CURRENT_STATE.md` or the related task.
