import type { ProviderExportGuide } from "@/lib/ingest-contract";

export const PROVIDER_EXPORT_GUIDES: ProviderExportGuide[] = [
  {
    provider: "chatgpt",
    label: "ChatGPT",
    statusLabel: "Official export zip",
    uploadTarget: "Extract and upload conversations.json",
    steps: [
      "Sign in to ChatGPT on the web.",
      "Open your profile menu in the lower-left corner.",
      "Go to Settings, then Data Controls.",
      "Choose Export Data and confirm the export request.",
      "Wait for the email from OpenAI and download the export zip within 24 hours.",
      "Extract the zip and upload conversations.json into SlopVault."
    ],
    notes: [
      "The export link expires after 24 hours.",
      "If you only need one thread fast, plain copy-paste is still supported."
    ],
    sourceUrl:
      "https://help.openai.com/en/articles/7260999-how-do-i-export-my-chatgpt-history-and-data"
  },
  {
    provider: "claude",
    label: "Claude",
    statusLabel: "Official export archive",
    uploadTarget: "Upload the conversation JSON files from the export archive",
    steps: [
      "Open Claude on the web or Claude Desktop.",
      "Click your initials in the lower-left corner.",
      "Open Settings, then Privacy.",
      "Choose Export data.",
      "Wait for the email link from Anthropic and download the archive while the link is still valid.",
      "Extract the archive and upload the conversation JSON file or files into SlopVault."
    ],
    notes: [
      "Anthropic says exports cannot be requested from the mobile apps.",
      "If you only have one thread, plain copy-paste is the faster fallback."
    ],
    sourceUrl:
      "https://support.anthropic.com/en/articles/9450526-how-can-i-export-my-claude-data"
  },
  {
    provider: "gemini",
    label: "Gemini",
    statusLabel: "Takeout / activity export",
    uploadTarget: "Upload the Gemini Apps activity JSON file",
    steps: [
      "Make sure Gemini Apps Activity is on for the chats you want to preserve.",
      "Open Gemini Apps Activity to confirm the conversations exist there.",
      "Open Google Takeout and start a new export.",
      "Deselect everything you do not need and keep the Gemini or Gemini Apps activity data selected.",
      "Choose JSON when the export format gives you that option, then create the export.",
      "Download the archive and upload the Gemini Apps activity JSON file into SlopVault."
    ],
    notes: [
      "Google's export path is less direct than ChatGPT or Claude.",
      "If you cannot get the JSON you want quickly, use copy-paste now and upload a higher-fidelity export later."
    ],
    sourceUrl: "https://support.google.com/gemini/answer/13594961"
  },
  {
    provider: "grok",
    label: "Grok",
    statusLabel: "Paste fallback",
    uploadTarget: "Use copy-paste unless you already have a JSON export",
    steps: [
      "Open your Grok conversation history.",
      "If your account or region provides a privacy export or history download, request it and keep the JSON file.",
      "If no export is available, open the thread you want and copy-paste it into SlopVault.",
      "Upload any JSON history file you receive later and SlopVault will classify it."
    ],
    notes: [
      "A stable self-serve full JSON export path was not clearly documented at implementation time.",
      "For Grok, copy-paste is currently the primary reliable capture path."
    ],
    sourceUrl: "https://help.x.com/en/using-x/about-grok"
  }
];

