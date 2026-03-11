# APP_FLOW.md

## Purpose

This document defines the intended screen hierarchy and user journey for the current MVP.

The MVP promise is simple:

- store your AI work in one place
- access it without hunting across tools
- share it when you want to

The parser and provenance system support that promise. They are not a reason to make the product harder to understand.

## Core Loop

1. Capture raw material
2. Parse or save it
3. Add minimal organization
4. Retrieve it later
5. Share it directly
6. Optionally inspect or extend lineage
7. Later: browse and fork other people's shared work

## Route Map

### `/`

#### Signed-Out Purpose

Public-facing landing and lightweight explore surface.

#### Signed-Out Primary Action

`Sign in to start your vault`

#### Signed-Out Content Order

1. what SlopVault is
2. a few recent or strong public artifacts
3. why prompt + output provenance matters
4. sign in / sign up

#### Signed-In Purpose

Vault home.

#### Signed-In Primary Action

`Paste or Upload`

#### Signed-In Content Order

1. quick capture panel
2. recent artifacts
3. unresolved placements
4. recently shared artifacts
5. explore preview

The signed-in home page is not a public feed clone.

### `/dump`

#### Purpose

The unified intake surface for everything the user might bring into SlopVault.

#### Primary Action

`Parse`

#### Key Regions

- raw input surface
- drag and drop area
- provider export JSON upload
- standalone prompt input
- standalone artifact upload
- parsed preview
- metadata summary
- save controls
- export help entry point

#### Notes

- This is the hero screen of the MVP.
- It should feel oversized, immediate, and forgiving.
- The user should not have to know whether they are creating a seed import, a trace import, a prompt import, or an artifact import.
- The system should detect and route the material after intake.
- Exact provider export help should be available from this screen for users willing to retrieve chat-history JSONs manually.

### `/vault`

#### Purpose

Private library of saved artifacts.

#### Primary Action

`Open artifact`

#### Key Regions

- search
- filters
- artifact list or grid
- sort controls

#### Notes

- This screen is about refinding, not admiration.
- Density is acceptable if scanning remains easy.

### `/artifact/[id]`

#### Purpose

Read, inspect, and share a single artifact.

#### Primary Action

`Share`

#### Key Regions

- content column
- prompt block if available
- output/result content
- provenance inspector
- related artifacts

#### Notes

- This is where sharing becomes seamless.
- A user should be able to make an artifact public from here without navigating elsewhere.

### `/shared`

#### Purpose

Manage everything the user has already shared publicly.

#### Primary Action

`View public artifact`

#### Key Regions

- public artifacts
- draft-ready private artifacts
- visibility filters

#### Notes

- This page is about control and curation.
- It is not a popularity dashboard.

### `/explore`

#### Purpose

Browse public work from other users.

#### Primary Action

`Open artifact`

#### Key Regions

- public artifact feed
- filters or modes
- lightweight provenance

#### Notes

- Initial public browse can be artifact-first.
- Later, nodes and richer feed modes can extend this route.

### `/seed/[id]`

#### Purpose

Advanced continuity view for one idea across related artifacts.

#### Primary Action

`Open journey`

#### Key Regions

- seed identity
- current revision
- linked artifacts
- recent trace activity
- provenance context

#### Notes

- This is not the MVP homepage.
- It becomes valuable once the user has enough related material to justify it.

### `/journey/[id]`

#### Purpose

Inspect and correct lineage.

#### Primary Action

`Confirm link`

#### Key Regions

- lineage canvas
- compare mode
- inspector
- confidence actions

#### Notes

- This is a power surface.
- The view must explain why a connection exists.

## Key User Flows

### Flow 1: Capture and Save

1. User opens `/dump` or uses quick capture on `/`
2. User pastes transcript, prompt, file, link, or provider export JSON
3. System parses what it can
4. User reviews output and metadata
5. User saves artifact
6. Artifact appears in `/vault`

### Flow 1A: Source JSON Import

1. User opens `/dump`
2. User opens provider export guidance if needed
3. User uploads source JSON or exported history file
4. System classifies the file and extracts prompts, outputs, artifacts, and provenance where possible
5. User reviews the proposed import result
6. User confirms save

### Flow 1B: Standalone Artifact Import

1. User opens `/dump`
2. User drags in one artifact or a batch up to `10`
3. System extracts basic metadata and previews the items
4. User adds minimal titles, tags, or visibility if needed
5. User saves to `/vault`

### Flow 1C: Standalone Prompt Import

1. User opens `/dump`
2. User pastes or uploads prompt text
3. System stores it as a prompt-first artifact or links it to a later output when possible
4. User reviews and saves

### Flow 2: Retrieve

1. User opens `/vault`
2. User searches, filters, or scans recent items
3. User opens an artifact
4. User uses provenance or related items to continue work

### Flow 3: Direct Share

1. User opens `/artifact/[id]`
2. User chooses `Share`
3. System shows exactly what becomes public
4. User confirms visibility
5. Public artifact page becomes available

This is the MVP share flow.

### Flow 4: Browse Others

1. User opens `/explore`
2. User scans public artifacts
3. User opens a public artifact
4. User reads prompt/result and provenance summary
5. Later, the user can fork or package related work

### Flow 5: Provenance Extension

1. User opens an artifact with related links
2. User follows a seed or journey entry point
3. User sees linked material, revisions, and evidence
4. User confirms or corrects lineage

This flow is important, but it is an extension of the vault, not the front door.

## Public and Private Behavior

- Everything starts private.
- Public sharing is explicit.
- Public artifact pages show a curated provenance subset:
  - prompt when available
  - output
  - model
  - surface
  - created date
  - related public artifacts when helpful
- Private-only notes, uncertain lineage, and raw internal evidence stay private by default.

## Screen Priority Summary

For the current MVP, design priority is:

1. Dump
2. Vault
3. Artifact detail
4. Shared
5. Explore
6. Seed detail
7. Journey

If a design decision makes the first three screens worse in order to make the last two more impressive, it is the wrong decision for this stage.
