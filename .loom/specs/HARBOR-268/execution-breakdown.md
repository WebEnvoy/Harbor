# HARBOR-268 Execution Breakdown

## U-001 XHS Search Semantics

- Require query-bound, non-empty, structurally valid note results before completion.
- Reject empty, invalid, cross-origin, mismatch, home/login/challenge and shell states.
- Validate with focused extraction and operation tests.

## U-002 Opaque Detail Targets

- Mint existing opaque refs only from verified canonical `/explore/<24-hex-note-id>` targets.
- Preserve same-session, expiry and single-use behavior.

## U-003 Live Closeout

- After merge and downstream Core/App integration, the main controller runs packaged XHS search-to-detail E2E.
- This implementation batch performs no production page action.
