export type ProblemGuide = {
  slug: string;
  category: "subscription" | "online_purchase";
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
    category: "subscription",
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
    category: "subscription",
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
    category: "subscription",
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
    category: "online_purchase",
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
    category: "online_purchase",
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
  {
    slug: "online-order-not-received",
    category: "online_purchase",
    eyebrow: "Order not received",
    title: "What to do when an online order has not arrived",
    description: "Check tracking, delivery evidence and seller deadlines before requesting a replacement or refund for an undelivered online order.",
    summary: "Start with the promised delivery date and the latest carrier scan. A late order, a package marked delivered and a shipment that never left the seller require different evidence.",
    steps: ["Save the order confirmation and promised delivery date.", "Check the carrier’s official tracking page and delivery details.", "Look for safe-place, reception or household delivery information.", "Contact the seller through the marketplace or official support channel.", "Request the available replacement or refund route and save the case reference."],
    evidence: ["Order confirmation and order number", "Promised delivery date", "Carrier tracking history", "Messages exchanged with the seller"],
    avoid: ["Relying only on a tracking screenshot without the order details", "Contacting a seller through an unofficial social-media account", "Allowing a marketplace claim deadline to pass"],
    faqs: [{ question: "What if tracking says delivered but I did not receive it?", answer: "Check the delivery address, safe places, reception, neighbours and carrier proof. Report the missing delivery promptly to the seller and carrier using their official channels." }, { question: "Should I contact the seller or delivery company first?", answer: "Notify the seller because your purchase contract is normally with the seller, while also asking the carrier for delivery details when tracking is disputed." }],
    updatedAt: "2026-10-07",
  },
  {
    slug: "item-not-as-described-refund",
    category: "online_purchase",
    eyebrow: "Not as described",
    title: "How to request a refund when an item is not as described",
    description: "Document the difference between the product listing and the item received before opening a return, refund or marketplace claim.",
    summary: "Use specific differences rather than general dissatisfaction. Compare the listing with the delivered item’s model, size, colour, condition, quantity or advertised features.",
    steps: ["Save the original product listing and order confirmation.", "Photograph the item, packaging and product labels clearly.", "List the exact ways the item differs from the description.", "Open the seller or marketplace return process within its deadline.", "Keep the return label, tracking and written decision."],
    evidence: ["Original listing or description", "Clear photos or video of the received item", "Order and payment record", "Seller messages and return instructions"],
    avoid: ["Using or altering the item more than necessary to inspect it", "Returning it without trackable proof", "Making claims that the photos do not support"],
    faqs: [{ question: "Is not liking an item the same as not as described?", answer: "No. Not as described means the item materially differs from the seller’s listing. A change of mind normally follows a separate return policy." }, { question: "What should my photos show?", answer: "Show the complete item, the specific defect or difference, packaging, labels and any model or serial information relevant to the listing." }],
    updatedAt: "2026-10-07",
  },
  {
    slug: "damaged-item-refund",
    category: "online_purchase",
    eyebrow: "Damaged delivery",
    title: "How to request a refund for an item that arrived damaged",
    description: "Preserve packaging and create clear delivery evidence before asking the seller for a replacement, return or refund.",
    summary: "Photograph the damage before discarding packaging or attempting a repair. Sellers and carriers may need evidence showing both the item and the condition of the parcel.",
    steps: ["Photograph the unopened parcel if damage is visible.", "Record the item, internal packaging, shipping label and damage.", "Check the seller’s damaged-item reporting deadline.", "Contact the seller and choose the offered replacement or refund route.", "Use tracked return shipping when a return is required."],
    evidence: ["Photos of the damaged item", "Packaging and shipping-label photos", "Order confirmation", "Seller report and return tracking"],
    avoid: ["Discarding packaging before the case is reviewed", "Attempting repairs that obscure the original damage", "Paying return postage without checking who is responsible"],
    faqs: [{ question: "Should I refuse a visibly damaged delivery?", answer: "Follow the seller and carrier instructions available in your location. If you accept it, document the parcel before opening and report the damage promptly." }, { question: "Can the seller require the item to be returned?", answer: "A seller may require a return before issuing a refund or replacement. Confirm the authorised method, address and responsibility for return costs in writing." }],
    updatedAt: "2026-10-07",
  },
  {
    slug: "duplicate-online-purchase-charge",
    category: "online_purchase",
    eyebrow: "Duplicate order charge",
    title: "What to do when an online purchase is charged twice",
    description: "Distinguish a temporary card authorization from a completed duplicate charge and prepare matching transaction evidence.",
    summary: "Two entries do not always mean two completed payments. Check whether one is pending, whether there are two order numbers and whether both amounts have fully posted.",
    steps: ["Compare the amount, merchant descriptor and transaction dates.", "Check whether either entry is pending or only an authorization.", "Review the store account for duplicate orders or receipts.", "Contact the merchant with both transaction references.", "If both charges remain completed and unresolved, ask the payment provider about its dispute route."],
    evidence: ["Both transaction entries with sensitive details hidden", "Order history and receipts", "Merchant response", "Dates when pending entries became final"],
    avoid: ["Disputing a temporary authorization before it has had time to clear", "Submitting the same charge twice under different descriptions", "Sharing full card numbers or security codes"],
    faqs: [{ question: "Why do I see a pending and completed charge?", answer: "Some merchants place an authorization before completing payment. The pending entry may disappear, but you should monitor it and ask the merchant or issuer if it remains." }, { question: "What proves a true duplicate charge?", answer: "Two completed charges for the same purchase, supported by matching amounts and merchant details but only one valid order, provide clearer duplicate-billing evidence." }],
    updatedAt: "2026-10-07",
  },
  {
    slug: "returned-item-refund-not-received",
    category: "online_purchase",
    eyebrow: "Returned but not refunded",
    title: "What to do when a returned item has not been refunded",
    description: "Use return tracking, warehouse delivery and the seller’s processing window to follow up on a missing online-purchase refund.",
    summary: "Separate return delivery from refund processing. Tracking may prove that a warehouse received the parcel, but the seller may still need to inspect and approve it before sending the refund.",
    steps: ["Confirm the return was sent using the authorised method.", "Save tracking showing the delivery date and location.", "Check the seller’s stated inspection and refund processing period.", "Ask the seller to confirm approval, amount and refund reference.", "After the stated period, contact the payment provider with the complete return record if necessary."],
    evidence: ["Return authorization or label", "Carrier acceptance and delivery tracking", "Seller’s refund timeframe", "Written follow-up and refund reference"],
    avoid: ["Using an unapproved return address", "Losing the postage receipt or tracking number", "Counting bank posting time from the day the parcel was sent"],
    faqs: [{ question: "When does the refund timeline begin?", answer: "Policies vary. Some sellers count from warehouse receipt, while others count from inspection or approval. Check the written policy and ask for the processed date." }, { question: "What if the seller says the parcel was empty or damaged?", answer: "Provide packing photos, parcel weight, the return receipt and tracking. Ask for the seller’s inspection evidence and use the marketplace appeal route where available." }],
    updatedAt: "2026-10-07",
  },
];

export function getProblemGuide(slug: string) {
  return problemGuides.find((guide) => guide.slug === slug);
}
