# Claude Code from iPhone & iPad — Operating Guide
### For the Kansai 2026 trip app · build phase and trip phase

---

## 1. First, the thing that surprises everyone

**There is no separate Claude Code mobile app.** Everything lives in the **Code tab of the regular Claude app**. On iPad you install the same iOS app.

And there are **three different first-party ways** to reach Claude Code from a phone. They are not interchangeable, and picking the wrong one for your situation is the main way people get stuck.

| Path | Where the code runs | Keeps your CLAUDE.md, skills, local MCP? | Use it for |
|---|---|---|---|
| **Remote Control** | **Your computer** | ✅ Yes — everything | Building the app, Aug–Sep |
| **Cloud sessions** | Anthropic's infrastructure | ❌ Starts fresh from the repo | **During the trip** |
| **Dispatch** | Spawns a Code session | — | Fire-and-forget tasks |

> **The short version for you:** use **Remote Control** while you're building at home, and switch to **cloud sessions** for the trip itself. Section 6 explains why that switch matters more than it sounds.

**Account requirement:** cloud sessions and Remote Control both need a **claude.ai account** — Pro, Max or Team. They are *not* reachable with an Anthropic Console API key, or through a third-party provider like Bedrock. If you were planning to run Claude Code on an API key, that won't work for mobile.

---

## 2. One-time setup (5 minutes)

### On your computer

```bash
npm install -g @anthropic-ai/claude-code
claude --version          # must be 2.1.52 or higher for Remote Control
```

### On the phone or iPad

1. Install the **Claude app** from the App Store — the same app on both devices
2. Sign in with **the same claude.ai account and organisation** you use for Claude Code. A different account won't see your sessions
3. Optional shortcut: run **`/mobile`** inside any Claude Code session and it displays a QR code to download the app. `/ios` and `/android` do the same thing

### Turn on push notifications

Inside Claude Code on your computer:

```
/config
```

Enable the push toggles — the important one is **"Push when Claude decides."** Your phone then buzzes when Claude needs a decision instead of you checking every few minutes. You can also request one inline: *"notify me when the migration finishes."*

---

## 3. Remote Control — your build-phase workflow

This bridges a Claude Code session **running on your computer** to your phone. The machine still owns the files, the shell, your MCP servers, your environment variables and your permissions. The phone is just another window into it.

### Starting it

Either start a session already configured for it:

```bash
cd ~/projects/kansai-2026
claude remote-control --name kansai
```

Or turn it on mid-session:

```
/remote-control
```

You'll see **`/rc active`** in the terminal status area when it's live.

> Use a **named** session (`--name kansai`). If you ever run Claude Code in more than one folder, the mobile session list becomes unreadable without names.

### Connecting from the phone

Two options:

- **Scan the QR code** the terminal displays, or
- Open the **Claude app → Code tab → tap your session** in the list. Online sessions show a computer icon with a green dot

You can also reach it from **claude.ai/code** in any browser, including Safari on iPad.

### What you can do from there

Send messages from terminal, browser and phone interchangeably — the conversation stays in sync across all of them. Attachments work too: **a photo or file you add in the Claude app gets downloaded to your machine** and passed to Claude as an `@` file reference. Useful for sending a screenshot of a broken layout while you're out.

### The things that will trip you up

**Closing the Claude app does not end the session.** It keeps running on your computer. Reopen the app, tap Code, tap the session, carry on.

**But your computer must stay awake.** If it sleeps past the timeout or loses the network for long enough, the session dies and disappears from the list. To recover you have to go back to the machine and run `claude remote-control` again.

On macOS, before you walk away:
```bash
caffeinate -dimsu &
```
Or set the display to sleep but the machine not to, in System Settings → Lock Screen.

**Security model, since you'll wonder:** your machine makes **outbound HTTPS only**. No inbound ports are opened. The local session registers with the Anthropic API and polls for work; traffic is routed over TLS, same as any Claude Code session.

**Status:** Remote Control shipped as a research preview in February 2026. Check `code.claude.com/docs/en/mobile` for current behaviour before you rely on it for anything time-critical.

---

## 4. Cloud sessions — your trip-phase workflow

Cloud sessions run on **Anthropic's infrastructure**, not your machine. Open the Claude app → Code tab → start a new session against your GitHub repo.

**The tradeoff:** a cloud session starts fresh. It does not inherit your local environment. Which leads to the single most important design consequence in this whole document:

> ### ⚠️ Anything a cloud session needs must live in the repo
>
> - **`CLAUDE.md` must be committed to the repo root**, not sitting in `~/.claude/`
> - **Skills must be in `.claude/skills/` in the repo**, not user-level
> - **MCP servers must be HTTP transport**, not local stdio processes
>
> Get this wrong and your trip-week sessions arrive with no idea what the project is.

### Why your Supabase choice already solved the MCP half

This is a happy accident worth noticing. The Supabase MCP server is **HTTP transport**:

```
https://mcp.supabase.com/mcp?project_ref=<ref>&read_only=true
```

An HTTP MCP server is reachable from a cloud session. A local stdio Postgres server — `npx @modelcontextprotocol/server-postgres` — would not have been, because there's no local process to run it. Had you stayed on Render Postgres with a stdio MCP, your entire mid-trip replanning workflow would have depended on a laptop in Singapore staying awake for eight days.

**Verify this before you fly.** Start a cloud session from your phone, and ask it something that requires a database read: *"How many activities are scheduled for 24 September?"* If it answers, you're set. If it can't reach the MCP server, fall back to the token-protected `/api/trip/export` endpoint — which is exactly why the guide told you to build both.

---

## 5. Making mobile prompting actually pleasant

Typing on a phone is the constraint, not Claude. Three things fix it.

### Skills turn paragraphs into one word

The four skills from the build guide (`daily-brief`, `replan`, `write-blog`, `sync-plan`) exist for this. On a laptop they're a convenience. On a phone at 7am in Fushimi Inari they're the difference between using the thing and not.

Commit them to `.claude/skills/` so cloud sessions get them too.

### Use plan mode for anything structural

`/plan` first, read the plan, then approve. On mobile you cannot skim a 40-file diff — so make Claude tell you what it intends *before* it does it. Your `CLAUDE.md` already carries the rule about proposing itinerary changes before writing them; the same discipline applies to code.

### Keep sessions short and use `/compact`

`/context` shows what's filling the window. When a session gets long, `/compact` summarises it. Long-running mobile sessions are where context quietly fills up and answers get worse.

---

## 6. iPhone vs iPad — honest expectations

**Don't try to do the initial scaffold from a phone.** Phases 0–2 of the build guide — scaffolding, migrations, reviewing `seed.ts`, testing RLS — need a real screen. You have to *read* the seed file properly; everything downstream inherits its mistakes.

| | Realistic |
|---|---|
| **iPhone** | Prompting, approving tool calls, reading summaries, replanning during the trip. Reviewing a diff is painful |
| **iPad + keyboard** | Genuinely workable as a second seat. Split View lets you keep the Claude app beside Safari showing your Render deployment. Fine for Phases 3–7 |
| **Computer** | Still where Phases 0–2 belong, and where you want to be when something breaks |

A realistic split for the next seven weeks: **computer for the two setup evenings, iPad for the incremental feature work, iPhone for approvals and the trip itself.**

---

## 7. Trip-week setup — do this before 19 September

- [ ] **Commit `CLAUDE.md` to the repo root.** Confirm it's tracked in git, not gitignored
- [ ] **Commit all four skills to `.claude/skills/`**
- [ ] **Confirm the Supabase MCP URL is HTTP** with `project_ref` and `read_only=true`
- [ ] **Do a dry run:** from your phone, start a *cloud* session (not Remote Control) and run `/replan` with a fabricated scenario. *"Pretend it's the evening of 24 September, we skipped Kiyomizu-dera, propose a revised Friday."* If it can't read the database or doesn't know what the trip is, fix it now
- [ ] **Verify the `/api/trip/export` fallback** works with a plain `curl` and your bearer token
- [ ] **Enable push notifications** so long tasks tell you when they're done
- [ ] **Decide the laptop question.** If you're leaving it at home and want Remote Control as a backup, it must stay awake and online for eight days. Honestly? Don't rely on it. Cloud sessions plus the export API is the more robust pair

---

## 8. Your first mobile session, step by step

1. On the computer: `cd ~/projects/kansai-2026 && claude remote-control --name kansai`
2. In the session: `/config` → enable push
3. On the iPhone: open the Claude app → **Code** tab → tap **kansai**
4. Send a small test prompt: *"What's in CLAUDE.md? Summarise the project in three sentences."*
5. Confirm the answer reflects the trip, not a generic project. If it doesn't, your `CLAUDE.md` isn't being read
6. Try something real: *"/plan — add a countdown component to the home page showing days until 19 September"*
7. Read the plan on your phone, approve, and let it run
8. Walk away. Come back to a push notification

If step 5 fails, stop and fix `CLAUDE.md` before anything else. Everything about working from a phone depends on Claude already knowing what the project is, because you won't be typing that context in each time.

---

## 9. Gotchas

**Session vanished from the list** — it ended. Usually the computer slept, lost the network, or the process was stopped. Go back to the machine and restart `claude remote-control`.

**Signed into the wrong account** — cloud sessions and Remote Control need the *same* claude.ai account and organisation as your CLI. An API key won't do it.

**MCP shows "Server Disconnected"** — fully quit and reopen the client. A reload isn't enough; it reads the connector list at full startup only.

**Approving destructive commands on a small screen** — set `/permissions` rules properly on the computer *before* you start working from mobile. Approving a `rm -rf` because you misread it on a phone is a real failure mode.

**Reading diffs on a phone** — don't. Ask for a summary of what changed and why, and review the actual diff on a proper screen later. `/diff` and `/code-review` are computer activities.

---

## 10. Reference

- Claude Code on mobile — `code.claude.com/docs/en/mobile`
- Remote Control — run `/remote-control` or `claude remote-control`
- Get the app — run `/mobile` for a QR code
- Web access — `claude.ai/code` in any browser

Both Remote Control and cloud sessions are evolving quickly. Check the docs before the trip rather than trusting a document written in July.
