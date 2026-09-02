const ALLOWED = new Map([
  ['received', new Set(['privacy_hold','structured','quarantine'])],
  ['privacy_hold', new Set(['structured','clarification','quarantine'])],
  ['structured', new Set(['clarification','cluster_review','implemented_elsewhere'])],
  ['clarification', new Set(['structured','not_pursued'])],
  ['cluster_review', new Set(['clustered','precheck','implemented_elsewhere'])],
  ['clustered', new Set(['precheck','theme_room'])],
  ['precheck', new Set(['theme_room','impact_review','not_pursued','implemented_elsewhere'])],
  ['theme_room', new Set(['impact_review','not_pursued'])],
  ['impact_review', new Set(['reform_candidate','not_pursued'])],
  ['reform_candidate', new Set(['reform_register','not_pursued'])],
  ['reform_register', new Set(['decision_path'])],
  ['quarantine', new Set(['privacy_hold','structured','removed'])]
]);

export function canTransition(from, to) {
  return ALLOWED.get(from)?.has(to) ?? false;
}

export function assertTransition(from, to) {
  if (!canTransition(from, to)) {
    const err = new Error(`Invalid IDEENWERK status transition: ${from} -> ${to}`);
    err.code = 'INVALID_STATUS_TRANSITION';
    throw err;
  }
}
