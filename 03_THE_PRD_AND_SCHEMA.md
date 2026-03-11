# SLOPVAULT: PRODUCT REQUIREMENTS DOCUMENT (PRD)

## 1. Tech Stack Recommendations (For AI Coding Assistants)
* **Frontend:** Next.js (React), Tailwind CSS (strict utilitarian dark mode theme).
* **Backend/Database:** Supabase (Postgres for relational data, Auth for users, Storage for media).
* **Parsing:** Custom Regex/Markdown parsers to clean up raw LLM copy-paste dumps.

## 2. MVP Core Features
### Feature A: The Dumpster (Input & Parser)
* A massive, forgiving text area.
* User pastes raw text from ChatGPT/Claude/Grok.
* Backend strips UI artifacts (e.g., "Thought for 2m 49s"), detects the prompt vs. output, and formats into clean Markdown.

### Feature B: The Stash (Private Vault)
* A grid/list view of all parsed inputs and uploaded media.
* Auto-tagging (e.g., `#Text`, `#GPT4`, `#SystemArchitecture`).

### Feature C: The Project Node (Lineage Canvas)
* Ability to select multiple items from The Stash and bundle them into a "Node" (e.g., combining a Markdown text file and an AI image).
* Visual representation of "Parent" and "Child" nodes.

### Feature D: The Feed & Fork
* **Public Feed:** Masonry layout of published Nodes. Sorted by "New" and "Hot" (upvotes).
* **Fork Button:** Allows User B to copy User A's Node into their own Stash, edit it, and republish it as a Child Node.

## 3. Database Schema (High-Level)
**Table: Users**
* `id` (UUID)
* `pseudonym` (String, unique)
* `created_at` (Timestamp)

**Table: Artifacts (The raw slop)**
* `id` (UUID)
* `user_id` (FK to Users)
* `type` (Enum: Text, Image, Audio_Link)
* `raw_content` (Text)
* `parsed_markdown` (Text)
* `metadata` (JSON - stores model used, prompt, seed)
* `visibility` (Enum: Private, Public)

**Table: Nodes (The bundled projects)**
* `id` (UUID)
* `user_id` (FK to Users)
* `title` (String)
* `parent_node_id` (FK to Nodes - THIS IS THE FORKING MAGIC)
* `upvotes` (Integer)
* `created_at` (Timestamp)

**Table: Node_Artifacts (Mapping table)**
* `node_id` (FK to Nodes)
* `artifact_id` (FK to Artifacts)

## 4. Roadmap
* **Phase 1 (Weeks 1-4):** Build the Parser and the Private Stash. Prove the single-player value first (Make it the best place to paste ChatGPT logs).
* **Phase 2 (Weeks 5-8):** Build the Node bundling and the Public Feed.
* **Phase 3 (Weeks 9-12):** Implement the Forking/Lineage tree visualization.