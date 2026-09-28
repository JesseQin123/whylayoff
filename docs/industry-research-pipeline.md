# Consent-gated industry problem research

The industry problem flow is a separate, optional step after the personal career service. Interview answers, resume facts, and career outputs are never copied into research automatically. A participant must activate the `product_research` purpose and explicitly save a reviewed problem card.

Each card captures the participant's firsthand area, workflow, role boundary, one concrete problem event, frequency, active time, waiting time, impact, workaround, barriers, and counterexamples. “No recurring problem observed” is a complete valid result. It prevents the system from forcing a problem narrative onto every participant.

Source categories remain separate:

- employer statements are attributed reports;
- firsthand observations describe what the participant directly saw;
- participant inferences contain causes, opportunities, and solution ideas;
- public context records optional external context;
- all other fields remain participant reports.

Every non-empty field becomes a claim retaining the exact reviewed text as its source quote. Claims start as `participant_confirmed`, `independentlyVerified: false`, and the card stays `unvalidated_participant_report`. An AI or automation idea therefore cannot be presented as validated market demand.

Corrections create a new card version and preserve the preceding fields in revision history. Revoking the product research grant immediately blocks research reads and writes while leaving personal career tools active. The privacy export still includes the participant's research cards, and deletion removes them.

The local admin preview calls the same permission-gated API as the participant flow. Production Supabase policies require both record ownership and a current selected `product_research` grant for problem cards and claims. A staff workspace will require a separate staff role policy before deployment; the current page does not provide cross-participant admin access.
