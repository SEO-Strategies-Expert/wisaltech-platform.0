/*
  Centralized image asset map for Wisal Tech.
  Single source of truth for every section-image path used across the site.
  Do not hardcode /images/... paths inside page markup — reference this map instead
  (this project is static HTML/JS, so pages read it as a plain global object,
  the closest equivalent available to a Next.js `site-assets.ts` module in this stack).
*/
window.SiteAssets = Object.freeze({
  sectionImages: Object.freeze({
    corporateSystem:   "/images/wisal-sections/01-corporate-office-system.webp",
    stationery:        "/images/wisal-sections/02-stationery-business-package.webp",
    brandIdentity:     "/images/wisal-sections/03-integrated-brand-identity.webp",
    companyProfile:    "/images/wisal-sections/04-company-profile.webp",
    editorialBrochure: "/images/wisal-sections/05-luxury-editorial-brochure.webp",
    servicesBrochure:  "/images/wisal-sections/06-services-brochure.webp",
    largeFormat:       "/images/wisal-sections/07-large-format-display.webp",
    outdoorCampaign:   "/images/wisal-sections/08-outdoor-billboard-campaign.webp",
    exhibitionRollup:  "/images/wisal-sections/09-exhibition-rollup-banner.webp",
    heroRows:          "/images/wisal-sections/10-hero-moving-rows-background.webp"
  }),
  /* Not yet supplied — pages must render through ImageWithFallback, never call these directly. */
  serviceImages: Object.freeze({
    branding:          "/images/wisal-services/service-branding-system.webp",
    seo:               "/images/wisal-services/service-seo-growth-dashboard.webp",
    erp:               "/images/wisal-services/service-erp-business-operations.webp",
    graphicDesign:      "/images/wisal-services/service-graphic-design-studio.webp",
    nfcCards:          "/images/wisal-services/service-nfc-smart-business-card.webp",
    webDevelopment:    "/images/wisal-services/service-web-responsive-devices.webp",
    digitalMarketing:  "/images/wisal-services/service-digital-marketing-campaign.webp",
    printing:          "/images/wisal-services/service-printing-production.webp",
    itOfficeTech:      "/images/wisal-services/service-it-office-infrastructure.webp"
  })
});
