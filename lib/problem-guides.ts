export type ProblemGuide = {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  summary: string;
  steps: string[];
  evidence: string[];
  avoid: string[];
  faqs: { question: string; answer: string }[];
  updatedAt: string;
};

export const problemGuides: ProblemGuide[] = [
  {
    slug: "unexpected-subscription-renewal-refund",
    eyebrow: "Unexpected renewal",
    title: "How to request a refund for an unexpected subscription renewal",
    description: "Learn what to check, what evidence to collect and which billing route to use after an unexpected subscription renewal.",
    summary: "Start by identifying who processed the payment. A service bought through Apple or Google may need to be handled through that platform rather than the service provider.",
    steps: ["Confirm the merchant, amount and renewal date on the receipt or transaction.", "Cancel future renewal without deleting your proof of purchase.", "Check the published refund terms for the company and payment platform.", "Send a short factual request explaining why the renewal was unexpected.", "Save the request, response and any promised refund date."],
    evidence: ["Renewal receipt or transaction screenshot", "Subscription and cancellation settings", "Previous trial or renewal terms", "Messages exchanged with the company"],
    avoid: ["Waiting while a refund or dispute deadline approaches", "Contacting an app developer when an app store processed the payment", "Making claims that are not supported by your records"],
    faqs: [{ question: "Does cancelling a subscription automatically refund the renewal?", answer: "Usually, cancellation stops future billing but does not automatically reverse a completed charge. Refund eligibility depends on the company, payment route and circumstances." }, { question: "Who should receive the request?", answer: "Check the receipt. Contact the platform that processed the payment, such as Apple or Google Play, when its billing system handled the purchase." }],
    updatedAt: "2026-09-11",
  },
  {
    slug: "charged-after-cancellation",
    eyebrow: "Charged after cancellation",
    title: "What to do when a subscription charges you after cancellation",
    description: "Build a clear refund request using your cancellation confirmation, billing record and the correct company support route.",
    summary: "A dated cancellation confirmation is often the most important evidence. Compare its effective date with the later charge before submitting your request.",
    steps: ["Locate the cancellation email, screenshot or account confirmation.", "Compare the cancellation effective date with the charge date.", "Check whether the charge was pending, final or tied to a different account.", "Ask the correct billing provider to refund the post-cancellation charge.", "Keep written confirmation of the decision and expected refund timing."],
    evidence: ["Cancellation confirmation and effective date", "Transaction showing the later charge", "Account email or subscription identifier", "Previous support messages"],
    avoid: ["Cancelling again without saving the confirmation", "Submitting evidence from a different account", "Opening several conflicting requests for the same charge"],
    faqs: [{ question: "What if I cannot find the cancellation confirmation?", answer: "Check email, account history and screenshots. You can still contact the company, but the date and proof of your earlier cancellation can materially strengthen the request." }, { question: "Should I contact my bank first?", answer: "Start with the merchant or payment platform unless the transaction is unauthorized or an urgent dispute deadline requires you to contact your payment provider." }],
    updatedAt: "2026-09-11",
  },
  {
    slug: "free-trial-became-paid",
    eyebrow: "Free trial charge",
    title: "How to request a refund when a free trial becomes paid",
    description: "Follow a practical process after a free trial converts into a paid subscription and collect the evidence your request may need.",
    summary: "Confirm the trial end date, renewal disclosure and payment processor. Then cancel future billing and submit your request through the correct route.",
    steps: ["Find the trial confirmation and stated end date.", "Confirm the date and amount of the first paid charge.", "Cancel the subscription to prevent another renewal.", "Check the company or app-store refund process.", "Explain the timeline accurately and retain the response."],
    evidence: ["Trial sign-up confirmation", "Renewal terms or reminder", "First paid transaction", "Cancellation confirmation"],
    avoid: ["Assuming cancellation alone reverses the payment", "Deleting the account before saving evidence", "Using the wrong platform’s refund process"],
    faqs: [{ question: "Can every free-trial charge be refunded?", answer: "No. Eligibility varies by company, location, payment route and the terms shown at sign-up. A prompt, well-documented request is generally easier to assess." }, { question: "Should I cancel before requesting a refund?", answer: "Cancelling can prevent another renewal. Save proof of the cancellation and make clear that your refund request concerns the completed charge." }],
    updatedAt: "2026-09-11",
  },
  {
    slug: "unrecognized-online-purchase",
    eyebrow: "Unknown transaction",
    title: "How to investigate an unrecognized online purchase",
    description: "Identify an unfamiliar online charge, protect your payment account and organize the evidence needed to report it.",
    summary: "Do not guess the merchant from a shortened billing descriptor. Check receipts, family purchases and platform order histories while protecting the payment account promptly.",
    steps: ["Record the exact billing descriptor, date, amount and currency.", "Search your email and relevant app-store or marketplace order histories.", "Check whether an authorized family member or second account made the purchase.", "Contact the merchant or platform through an official channel.", "If it remains unauthorized, secure the account and contact the payment provider promptly."],
    evidence: ["Transaction screenshot with sensitive details hidden", "Exact billing descriptor", "Relevant order-history results", "Merchant or platform response"],
    avoid: ["Publishing full card or account details", "Clicking contact links from suspicious messages", "Waiting to secure an account that may be compromised"],
    faqs: [{ question: "Is an unrecognized charge always fraud?", answer: "Not necessarily. Billing descriptors can differ from brand names, and purchases may come from another account or household member. Investigate promptly without assuming the cause." }, { question: "What details should I hide in uploaded evidence?", answer: "Do not expose full card numbers, passwords, security codes or unrelated personal information. Keep only the details needed to identify the transaction." }],
    updatedAt: "2026-09-11",
  },
  {
    slug: "refund-promised-not-received",
    eyebrow: "Missing refund",
    title: "What to do when a promised refund has not arrived",
    description: "Track a missing online refund using the promise date, refund reference and expected processing window.",
    summary: "First distinguish between a refund the seller merely approved and one it actually processed. Ask for a refund reference and compare the processing date with your payment provider’s normal posting window.",
    steps: ["Save the written refund approval and promised amount.", "Ask when the refund was processed and request its reference number.", "Confirm which card, wallet or payment method should receive it.", "Allow the stated processing window, then follow up in writing.", "Contact the payment provider with the reference if the processed refund still does not appear."],
    evidence: ["Written refund promise", "Refund amount and processing date", "Refund or transaction reference", "Statement showing it has not arrived"],
    avoid: ["Confusing approval with completed processing", "Sharing an unredacted financial statement", "Letting relevant dispute deadlines pass while waiting indefinitely"],
    faqs: [{ question: "Why can a processed refund take time to appear?", answer: "A merchant and payment provider may have separate processing periods. Ask for the processed date and reference before escalating." }, { question: "Where will the refund appear?", answer: "It normally returns through the original payment method, although the exact display and timing depend on the merchant and payment provider." }],
    updatedAt: "2026-09-11",
  },
];

export function getProblemGuide(slug: string) {
  return problemGuides.find((guide) => guide.slug === slug);
}
