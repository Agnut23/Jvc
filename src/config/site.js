// Site-wide settings. Nothing secret belongs in this file — it is bundled
// into the public JavaScript that every visitor downloads.
export const SITE = {
  name: "Anijelia",
  tagline: "Your World of Anime & Cinema.",
  // Where the Report / Contact form sends messages.
  // Option 1 (recommended): set VITE_REPORT_ENDPOINT in your .env file to the URL
  //   of your own backend / serverless function. It receives a JSON POST:
  //   { name, email, subject, message }
  // Option 2: leave it empty and set contactEmail — the form then opens the
  //   visitor's mail app addressed to you.
  reportEndpoint: import.meta.env.VITE_REPORT_ENDPOINT || "",
  contactEmail: "",
};
