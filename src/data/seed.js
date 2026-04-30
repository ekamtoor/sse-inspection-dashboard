// Seed data for first-run accounts. The Vanguard inspection dashboard now
// starts every fresh account empty — the operator builds their site list,
// schedule, and reports from scratch through the UI. Existing accounts keep
// whatever they already have in Supabase; this file only matters when a brand
// new user_data row is created on first login.

export const SEED_SITES = [];
export const SEED_SCHEDULED = [];
export const SEED_ISSUES = [];
export const SEED_CORPORATE = [];
