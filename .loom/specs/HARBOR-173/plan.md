# Plan

## Steps

1. Extend page scene facts with screenshot refs, page/frame refs, element source evidence refs, and screenshot evidence status while keeping raw page material private.
2. Extend runtime/viewer facts with Harbor-mediated local viewer entry states and user/agent/Core task controller readback.
3. Export the new facts through existing HarborRuntime surfaces and smoke output.
4. Add focused tests for screenshot/page/evidence refs, local viewer entry facts, controller states, and sensitive material boundaries.
5. Add item-specific HARBOR-173 Loom carriers for #160/#173/#174/#175/#176.
6. Run required local validation, open a PR, validate metadata, start hosted checks, and hand back PR Ready evidence without merging or closing issues.
