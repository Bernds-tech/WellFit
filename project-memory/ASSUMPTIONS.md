# Assumption Verification Register

Critical assumptions used to plan or execute work must be recorded here before they are relied upon.

Statuses: `NEEDS_VERIFICATION`, `VERIFIED`, `INVALIDATED`, `SUPERSEDED`.

Each active assumption must include: Assumption ID, Date/Updated, related task/change ID, risk level, assumption, why it matters, verification source/evidence, status, recheck trigger, and action if false.

Template:
```text
## ASM-YYYY-NNN
- Date:
- Updated:
- Related task:
- Risk: R1|R2|R3|R4
- Assumption:
- Why it matters:
- Verification source/evidence:
- Status: NEEDS_VERIFICATION
- Recheck trigger:
- Action if false:
```

Do not delete invalid assumptions; preserve them as `INVALIDATED` or `SUPERSEDED`.
