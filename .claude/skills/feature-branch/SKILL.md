---
name: "feature-branch"
description: "Sync with main and cut (or resume) the feature's own branch before any implementation work starts. Invoke at the pending → in_progress transition, right after the human approves a spec and before the first task-implementer call — and whenever work is about to begin on a feature while HEAD is on main or on some other feature's branch. Also use when resuming an in_progress feature in a fresh session, to confirm HEAD is on the right branch and up to date with main."
argument-hint: "Optional feature id (e.g. 002-kyc-document-verification). Defaults to the feature currently in_progress in feature_list.json."
compatibility: "Requires a git repo with an 'origin' remote and a 'main' default branch"
metadata:
  author: "draw-a-card"
user-invocable: true
disable-model-invocation: false
---

## User Input

```text
$ARGUMENTS
```

Treat a feature id in the input as the feature to branch for. If empty, resolve the feature
yourself (step 1).

## What this skill is for

**One branch per feature, cut fresh from an up-to-date `main`.** Every task in that feature's
`tasks.md` lands on that one branch, which merges back to `main` through a single PR.

The default branch is **`main`**. This repo has no `master`.

Do *not* cut a branch per `tasks.md` task (T001, T002, …). Individual tasks are reviewed by
`code-reviewer` on the feature branch, not merged separately.

## When to run it

Run at the **`pending` → `in_progress` transition**: the human has approved the spec, and the
first `task-implementer` call has not happened yet. Also run when resuming an `in_progress`
feature in a new session, to verify HEAD is where it should be.

Do **not** run it:

- Before the human approval gate. A `spec_ready` feature has no branch yet — spec/plan/tasks
  are written on whatever branch you're on and carried over by step 3's stash.
- For a trivial fix under `CLAUDE.md`'s exemption (typo, config tweak, copy change) that isn't
  a `feature_list.json` feature at all.

## Procedure

### 1. Resolve the feature and its branch name

Take the feature id from `$ARGUMENTS`, else the entry in `feature_list.json` whose status is
`in_progress`, else the one the human just approved. **The branch name is exactly the feature
id** — `002-kyc-document-verification`, not `feat/002` or `002-kyc-v2`.

If you cannot resolve exactly one feature, stop and ask. Never guess a branch name.

### 2. Confirm the feature is actually ready to branch

Read that feature's entry in `feature_list.json`. If its status is still `pending` or
`spec_ready`, **stop** — cutting a branch signals implementation is starting, and starting
implementation before the human approval gate violates AGENTS.md §3 and Constitution
Principle VI (Spec Before Code). Report the gate rather than proceeding.

### 3. Protect uncommitted work

Run `git status --short`. If anything is modified or untracked:

- Work belonging to **this** feature (its `specs/` dir, `feature_list.json`,
  `progress/current.md`, and its `app/` / `src/` changes): stash it with
  `git stash push -u -m "<feature-id> pre-branch"`. The `-u` is required — spec directories are
  untracked and a plain `git stash` silently leaves them behind.
- Work belonging to a **different** feature, or anything you can't account for: **stop and ask
  the human.** Do not stash, commit, checkout over, or discard it.

Never use `git checkout -f`, `git reset --hard`, or `git clean` to get a clean tree. This repo
is an Expo app — `.expo/`, `dist/`, and `node_modules/` are build output, but never rely on
that assumption to force-clean anything.

### 4. Update main

```bash
git fetch origin
git checkout main
git pull --ff-only
```

`--ff-only` is deliberate: if `main` has diverged from `origin/main`, that's a real situation
needing a human decision, not something to paper over with a merge commit. On failure, stop and
report.

### 5. Cut or resume the branch

- **Branch doesn't exist** → `git checkout -b <feature-id>`.
- **Exists locally** (resuming) → `git checkout <feature-id>`, then bring it up to date with the
  freshly-pulled `main` (`git merge main`, or rebase if the branch has never been pushed).
  Report any conflicts to the human instead of resolving them unilaterally.
- **Exists on origin but not locally** → `git checkout -b <feature-id> origin/<feature-id>`.

### 6. Restore the stash

`git stash pop` if you stashed in step 3. On conflict, stop and report — never `git checkout
--theirs/--ours` your way out of it.

### 7. Verify and record

1. Run `./init.sh` and confirm `RESULT: SUCCESS`. A branch cut from a broken `main` is worth
   knowing about before the first task, not after. If the switch changed dependencies, let
   `init.sh` reinstall rather than reaching for a manual `npm install`.
2. Add `"branch": "<feature-id>"` to that feature's entry in `feature_list.json` (entries here
   don't carry the field yet — this skill is what starts populating it).
3. Note the branch and the `main` commit it was cut from in `progress/current.md`.

## Hard rules

- **Never commit or push on the human's behalf** unless they explicitly ask. Cutting a branch is
  not permission to commit onto it.
- **Never force-push, never `git push --force-with-lease`, never delete a branch** as part of
  this skill.
- **Never open a PR** here. That's an explicit, separate human request.
- If any git command fails, stop and report the actual error. Don't retry with a more forceful
  variant — the forceful variant is how uncommitted work gets destroyed.
