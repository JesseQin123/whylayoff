export type PartnerStatus = "resource_source" | "prospect" | "terms_pending" | "active" | "paused" | "expired";
export type OfferAvailability = "external_resource" | "verified_inventory" | "pending" | "unavailable";

export type PartnerDefinition = {
  id: string;
  name: string;
  status: PartnerStatus;
  relationshipLabel: string;
  disclosure: string;
};

export type OfferDefinition = {
  id: string;
  partnerId: string;
  title: string;
  availability: OfferAvailability;
  description: string;
  termsSummary: string;
  eligibility: string;
  url: string | null;
  codes?: string[];
};

export const benefitPartners: PartnerDefinition[] = [
  {
    id: "muse-community",
    name: "Muse invitation codes",
    status: "resource_source",
    relationshipLabel: "Independent community resource",
    disclosure: "The linked community page says it is not affiliated with Meta. Next Chapter has not verified code availability, token amounts, eligibility, or redemption terms.",
  },
  {
    id: "jobright",
    name: "Jobright.ai",
    status: "terms_pending",
    relationshipLabel: "Potential partner · terms pending",
    disclosure: "No coupon, referral benefit, or formal collaboration is active. This listing records a future partnership candidate only.",
  },
];

export const benefitOffers: OfferDefinition[] = [
  {
    id: "muse-community-directory",
    partnerId: "muse-community",
    title: "Browse community-reported Muse invitation codes",
    availability: "external_resource",
    description: "Open the independent directory and review its current listings yourself. Availability may change without notice.",
    termsSummary: "External resource only. No code is assigned or guaranteed by Next Chapter.",
    eligibility: "Check the external page and applicable Muse terms for your country and account.",
    url: "https://muse-codes.pages.dev/",
  },
  {
    id: "jobright-future-offer",
    partnerId: "jobright",
    title: "Potential Jobright.ai benefit",
    availability: "pending",
    description: "A possible job-search benefit is being evaluated.",
    termsSummary: "No offer can be claimed while terms are pending.",
    eligibility: "To be defined if a verified offer becomes active.",
    url: null,
  },
];

export function findBenefitOffer(offerId: string) {
  return benefitOffers.find((offer) => offer.id === offerId) ?? null;
}

export function publicBenefitCatalog() {
  return benefitOffers.map((offer) => ({
    id: offer.id,
    partnerId: offer.partnerId,
    title: offer.title,
    availability: offer.availability,
    description: offer.description,
    termsSummary: offer.termsSummary,
    eligibility: offer.eligibility,
    url: offer.url,
    partner: benefitPartners.find((partner) => partner.id === offer.partnerId)!,
  }));
}
