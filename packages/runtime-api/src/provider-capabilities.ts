import type {
  BrowserProviderCapabilityFact,
  BrowserProviderCapabilityKey,
  BrowserProviderCapabilityState,
  BrowserProviderDownloadGuide,
  BrowserProviderFactSource
} from "./provider-management.js";

export function cloakCapabilities(): BrowserProviderCapabilityFact[] {
  return [
    capability("persistent_profile", "supported", "configured", "Uses dedicated persistent browser profile storage."),
    capability("independent_user_data_dir", "supported", "configured", "Keeps identity storage separate from user daily browser data."),
    capability("proxy", "provider_claim", "provider_claim", "Provider supports proxy-bound identity configuration; Harbor still needs runtime validation."),
    capability("timezone", "provider_claim", "provider_claim", "Provider claims native timezone alignment through binary arguments."),
    capability("locale", "provider_claim", "provider_claim", "Provider claims locale alignment through binary arguments."),
    capability("viewport", "provider_claim", "provider_claim", "Provider supports viewport/window consistency controls."),
    capability("extensions", "supported", "configured", "Extension support is part of the Chromium profile model."),
    capability("cookie_persistence", "supported", "configured", "Cookies persist through the dedicated profile."),
    capability("cdp", "supported", "configured", "Harbor can launch/connect through CDP refs without exposing raw endpoints."),
    capability("viewer", "limited", "provider_claim", "Viewer is a Manager mechanism reference, not a public raw endpoint."),
    capability("snapshot_refs", "limited", "configured", "Harbor snapshot refs depend on a live Runtime Session."),
    capability("evidence_refs", "limited", "configured", "Harbor evidence refs depend on policy and live Runtime Session."),
    capability("native_fingerprint_control", "provider_claim", "provider_claim", "Native fingerprint control remains a provider claim until Harbor validation evidence exists."),
    capability("anti_detection_binary_patches", "provider_claim", "provider_claim", "Anti-detection patches are recorded as claims, not task success guarantees."),
    capability("automation_exposure_reduction", "provider_claim", "provider_claim", "Provider claims reduced automation exposure; Harbor does not promise target-site success.")
  ];
}

export function chromeCapabilities(): BrowserProviderCapabilityFact[] {
  return [
    capability("persistent_profile", "limited", "configured", "Harbor can use a dedicated profile, but Chrome has no provider-native identity controls."),
    capability("independent_user_data_dir", "supported", "configured", "A dedicated user data dir can isolate Harbor from daily Chrome."),
    capability("proxy", "limited", "configured", "Proxy can be configured at launch or environment level but lacks provider-native consistency facts."),
    capability("timezone", "limited", "configured", "Timezone changes are automation-layer or system-level, not native fingerprint control."),
    capability("locale", "limited", "configured", "Locale can be configured, but consistency is limited."),
    capability("viewport", "limited", "configured", "Viewport can be configured through automation."),
    capability("extensions", "limited", "configured", "Extension support depends on launch mode and user policy."),
    capability("cookie_persistence", "supported", "configured", "Cookies persist through the dedicated profile."),
    capability("cdp", "supported", "configured", "Chrome supports CDP refs."),
    capability("viewer", "limited", "configured", "Local window observation is possible, but Harbor viewer facts remain mediated."),
    capability("snapshot_refs", "limited", "configured", "Harbor snapshot refs depend on a live Runtime Session."),
    capability("evidence_refs", "limited", "configured", "Harbor evidence refs depend on policy and live Runtime Session."),
    capability("native_fingerprint_control", "unsupported", "configured", "Official Chrome has no native fingerprint provider controls."),
    capability("anti_detection_binary_patches", "unsupported", "configured", "Official Chrome has no CloakBrowser binary patches."),
    capability("automation_exposure_reduction", "limited", "configured", "Harbor can reduce some temporary automation exposure but cannot provide full identity consistency.")
  ];
}

export function cloakLimitations(): string[] {
  return [
    "Provider claims require Harbor validation evidence before Core treats them as observed facts.",
    "Harbor does not redistribute or auto-download the CloakBrowser binary.",
    "No target-site pass rate or anti-detection success guarantee is exposed."
  ];
}

export function chromeLimitations(): string[] {
  return [
    "Restricted fallback only when CloakBrowser is missing or unavailable.",
    "No native fingerprint control or anti-detection binary patches.",
    "Must be shown as limited identity-environment consistency, not silent default."
  ];
}

export function cloakDownloadGuide(): BrowserProviderDownloadGuide {
  return {
    action: "manual_install",
    primary_url: "https://cloakbrowser.dev",
    fallback_url: "https://github.com/CloakHQ/CloakBrowser/releases",
    install_hint: "Install CloakBrowser from official CloakHQ channels or set CLOAKBROWSER_BINARY_PATH/HARBOR_CLOAKBROWSER_PATH to a verified local binary.",
    missing_impacts: [
      "CloakBrowser cannot be selected as the primary provider.",
      "Native fingerprint and anti-detection provider claims are unavailable.",
      "Identity environments may fall back to official Chrome with reduced consistency."
    ]
  };
}

export function chromeDownloadGuide(): BrowserProviderDownloadGuide {
  return {
    action: "manual_install",
    primary_url: "https://www.google.com/chrome/",
    install_hint: "Install official Google Chrome or set HARBOR_CHROME_PATH/CHROME_PATH to the Chrome executable.",
    missing_impacts: [
      "No restricted fallback provider is available if CloakBrowser is also missing.",
      "Local smoke cannot use official Chrome as a backup runtime."
    ]
  };
}

function capability(
  key: BrowserProviderCapabilityKey,
  state: BrowserProviderCapabilityState,
  source: BrowserProviderFactSource,
  note: string
): BrowserProviderCapabilityFact {
  return { key, state, source, note };
}
