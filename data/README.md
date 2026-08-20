# Participant updates

`participants.json` is the single source for the participant preview on the
homepage and the full participant directory.

To add or update a participant:

1. Add the 4:5 WebP portrait to `assets/people/`.
2. Add or edit the participant entry in `participants.json`.
3. Use an explicit `sortKey` beginning with the displayed first name. Put
   leading initials after the name in the displayed `name`; the generator
   never tries to infer or rearrange a person's name.
4. Run `node scripts/generate-participants.mjs`.
5. Validate with `node scripts/generate-participants.mjs --check` before
   committing.

Both generated sections retain equal portrait treatment and the same ordering.
