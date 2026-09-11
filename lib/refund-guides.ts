export type RefundGuide = {
  slug: string;
  name: string;
  title: string;
  description: string;
  routeNote: string;
  steps: string[];
  prepare: string[];
  actionLabel: string;
  actionUrl: string;
  sourceLabel: string;
  sourceUrl: string;
  updatedAt: string;
};

export const refundGuides: RefundGuide[] = [
  {
    slug: "apple",
    name: "Apple",
    title: "How to request an Apple refund",
    description: "Follow the correct route for App Store apps, subscriptions and other content billed by Apple.",
    routeNote: "If Apple processed the payment, submit the request to Apple rather than the app developer.",
    steps: ["Sign in to Apple’s Report a Problem service.", "Choose “Request a refund” and select the reason.", "Select the relevant app, subscription or item and submit.", "Check the request status after submission."],
    prepare: ["Apple receipt or matching charge", "Purchase date and amount", "Apple Account used for the purchase", "A short, factual explanation"],
    actionLabel: "Open Apple refund requests",
    actionUrl: "https://reportaproblem.apple.com/",
    sourceLabel: "Apple’s official refund guidance",
    sourceUrl: "https://support.apple.com/en-us/118223",
    updatedAt: "2026-09-10",
  },
  {
    slug: "google-play",
    name: "Google Play",
    title: "How to request a Google Play refund",
    description: "Check the route for apps, games, in-app purchases and subscriptions billed through Google Play.",
    routeNote: "Google says the available route can depend on what you bought, when you bought it and where you are located.",
    steps: ["Sign in to the Google Account used for the purchase.", "Open the Google Play refund request flow.", "Select the purchase and explain the issue accurately.", "Track the decision; Google says this usually takes one to four days."],
    prepare: ["Google Play order or transaction record", "Purchase date and amount", "Google Account used", "Screenshots supporting the problem"],
    actionLabel: "Open Google Play refund requests",
    actionUrl: "https://support.google.com/googleplay/workflow/9813244?hl=en",
    sourceLabel: "Google Play’s official refund guidance",
    sourceUrl: "https://support.google.com/googleplay/answer/15574897?hl=en",
    updatedAt: "2026-09-10",
  },
  {
    slug: "adobe",
    name: "Adobe",
    title: "How to cancel an Adobe plan and check for a refund",
    description: "Use the Adobe account route for plans bought directly from Adobe, and the original platform for third-party purchases.",
    routeNote: "Adobe directs purchases made through Apple, Google or Microsoft to those providers’ cancellation processes.",
    steps: ["Sign in to your Adobe account.", "Open Plans and payment, then Manage plan.", "Choose Cancel your plan and review the cancellation details.", "Save the confirmation email and check the refund terms for your plan."],
    prepare: ["Adobe invoice or charge", "Plan name", "Purchase or renewal date", "Cancellation confirmation, if available"],
    actionLabel: "Manage an Adobe plan",
    actionUrl: "https://account.adobe.com/plans",
    sourceLabel: "Adobe’s official cancellation guidance",
    sourceUrl: "https://helpx.adobe.com/account/individual/subscriptions-and-plans/renewals-and-cancellations/cancel-adobe-subscription.html",
    updatedAt: "2026-09-10",
  },
  {
    slug: "canva",
    name: "Canva",
    title: "How to handle a Canva subscription charge",
    description: "Identify whether Canva or an app store processed the payment before requesting cancellation or a refund.",
    routeNote: "A Canva subscription purchased through Apple or Google must normally be managed through that platform’s billing route.",
    steps: ["Check the receipt to identify who processed the payment.", "Review the subscription under Billing & plans in your Canva account.", "Cancel future renewal if needed.", "Contact Canva support with the charge details when Canva billed you directly."],
    prepare: ["Receipt or transaction screenshot", "Canva account email", "Charge date and amount", "Cancellation or support messages"],
    actionLabel: "Open Canva support",
    actionUrl: "https://www.canva.com/help/contact-us/",
    sourceLabel: "Canva Help Center",
    sourceUrl: "https://www.canva.com/help/",
    updatedAt: "2026-09-10",
  },
  {
    slug: "microsoft",
    name: "Microsoft",
    title: "How to request a Microsoft purchase refund",
    description: "Find the correct Microsoft route for apps, games, subscriptions and unrecognized account charges.",
    routeNote: "Microsoft uses different routes for PC apps, Xbox purchases, subscriptions and unrecognized charges.",
    steps: ["Sign in to the Microsoft account used for the purchase.", "Find the item in order history or subscription management.", "Use the refund option shown for an eligible item.", "For an unrecognized charge, use Microsoft’s payment investigation route."],
    prepare: ["Microsoft order history or charge", "Order number, if available", "Purchase date and amount", "Reason and supporting screenshots"],
    actionLabel: "Open Microsoft order history",
    actionUrl: "https://account.microsoft.com/billing/orders",
    sourceLabel: "Microsoft’s official refund guidance",
    sourceUrl: "https://support.microsoft.com/en-us/accounts-billing/subscriptions/get-a-refund-for-apps-and-games-purchased-from-microsoft-store",
    updatedAt: "2026-09-10",
  },
];

export function getRefundGuide(slug: string) {
  return refundGuides.find((guide) => guide.slug === slug);
}
