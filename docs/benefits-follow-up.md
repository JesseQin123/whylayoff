# Benefits, attribution, and follow-up operations

The benefits catalog separates the relationship with a provider from the availability of a specific offer. Partner states are `resource_source`, `prospect`, `terms_pending`, `active`, `paused`, and `expired`. Offer availability is `external_resource`, `verified_inventory`, `pending`, or `unavailable`.

Muse is currently an independent community resource. The catalog links to the community page supplied for the project and repeats that the page says it is not affiliated with Meta. Next Chapter does not claim inventory, remaining uses, token value, eligibility, or a formal collaboration. Jobright.ai remains `terms_pending`; the UI explicitly says that no coupon, referral benefit, or partnership is active.

Benefit activity uses these states:

```text
offered → assigned → opened → user_reported_success / user_reported_failed
                                  ↓
                         provider_verified

any unavailable claim attempt → unavailable
```

Assignment, code copy, and resource opening are activity events. They never set `provider_verified` and are not counted as redemption. A participant's success report remains self-reported until an internal provider-verification path records separate evidence. There is no public API action for provider verification.

Benefits can be viewed and opened without product research or marketing permission. A signed local session is used only to save activity and feedback. Benefit activity is included in privacy export and removed on deletion.

Email choices are independent: service email, course information, community invitations, and expert follow-up each have their own current grant. Saving a later version replaces the operational state used by filters and exports. Turning every option off opts out without affecting benefits, personal career tools, or research choices.

Session creation captures UTM source, medium, campaign, content, referrer, and landing path. The local operations preview can filter the current owner's profile by domain, role, region, language, expertise, active grant, and contact preference, and displays acquisition attribution. It does not provide cross-participant staff access; production requires staff authentication and role policies before that view is enabled.
