# Consistency Analysis

- Harbor owns the session-to-identity update and persistence.
- App only sends an explicit user intent and renders the Harbor public record; App does not infer or write a login fact locally.
- Core and Lode remain unchanged.
- The endpoint preserves the no-sensitive-material and no-external-write boundaries.
- Remaining cross-repo gap: App needs a dedicated consumer Work Item after this Harbor contract is merged.
