# Participant updates

`participants.json` is the single source for the participant preview on the
homepage and the full participant directory.

To add or update a participant:

1. When available, add the 4:5 WebP portrait to `assets/people/`. Without a portrait, use an explicit `slug`.
2. Add or edit the participant entry in `participants.json`.
3. Use an explicit `sortKey` beginning with the displayed first name. Put
   leading initials after the name in the displayed `name`; the generator
   never tries to infer or rearrange a person's name.
4. Run `node scripts/generate-participants.mjs`.
5. Validate with `node scripts/generate-participants.mjs --check` before
   committing.
6. Run `node scripts/check-site.mjs` to confirm that local assets, profile
   links, page anchors and image metadata remain valid.

Use `"group": "research"` for postdocs and technical contributors and
`"group": "student"` for students. Leave the field unset for the first
group. The directory sorts each group alphabetically, and the homepage
shows available portraits while counting everyone.
