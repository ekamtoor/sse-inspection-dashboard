// Single source of truth for white-label brand chrome. Swap any tenant by
// changing values here (or, when this lifts into Outpost, by reading them
// from tenant_config.branding). Every component / PDF / login screen reads
// from `branding` so onboarding a new company is one file edit.

const DEFAULT_BRANDING = {
  appName: "Vanguard",
  appEyebrow: "Pre-Inspection",
  parentName: "Seven Star Energy",
  // Public-path logo for the parent company. Drop the new tenant's logo into
  // /public/ and update this path. The PDF, sidebar, and login screen all
  // honor it. Leave as null/empty to hide the logo block.
  parentLogoUrl: "/seven-star-logo.png",
  parentLogoAlt: "Seven Star Energy",
  // Shown in the dark page footer of every PDF report.
  pdfFooterPrefix: "Vanguard · by Seven Star Energy",
  // Filename prefix for the downloaded PDF.
  pdfFilenamePrefix: "Vanguard",
};

// Allow runtime override (e.g. from a tenant_config row in Outpost). For now
// it just returns the constant — kept as a function so callers don't need to
// change when this becomes async / context-aware.
export function getBranding() {
  return DEFAULT_BRANDING;
}

export const branding = DEFAULT_BRANDING;
