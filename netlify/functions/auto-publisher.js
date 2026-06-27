const { schedule } = require("@netlify/functions");

const handler = async function(event, context) {
  console.log("Starting Auto-Publisher Cron Job...");

  // 1. The Prompt: Asking Gemini to write the article
  const prompt = `
    Act as a Senior Payments Architect. Write an ISO 20022 deep-dive article.
    Pick a random, advanced concept (e.g., pacs.004, camt.053, settlement batching, Nostro/Vostro).
    Use a 'Problem-First' approach. Use real-world physical analogies.
    
    You MUST output valid Markdown ONLY. No conversational intro/outro.
    You MUST start with this exact YAML frontmatter:
    ---
    id: "[generate-unique-id]"
    title: "[Engaging Title]"
    level: 300
    category: "Message Deep Dives"
    summary: "[1-sentence hook]"
    minutes: 8
    tags: ["ISO20022", "Payments"]
    ---
    
    Write the main content below this frontmatter.
  `;

  // 2. Fetch the article from Google AI Studio
  const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  const geminiData = await geminiResponse.json();
  let articleContent = geminiData.candidates[0].content.parts[0].text;
  
  // Clean up any stray markdown wrappers Gemini might add
  articleContent = articleContent.replace(/^```markdown\n/, '').replace(/\n```$/, '');

  // 3. Create a unique filename
  const date = new Date();
  const safeDate = date.toISOString().split('T')[0];
  const randomId = Math.floor(Math.random() * 1000);
  const fileName = `article-${safeDate}-${randomId}.md`;

  // GitHub API requires Base64 encoding
  const encodedContent = Buffer.from(articleContent).toString('base64');

  // 4. Push the new file to your GitHub repository
  const githubRepo = process.env.GITHUB_REPO; 
  const githubToken = process.env.GITHUB_PAT;

  const githubResponse = await fetch(`https://api.github.com/repos/${githubRepo}/contents/content/${fileName}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${githubToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Netlify-Auto-Publisher'
    },
    body: JSON.stringify({
      message: `Auto-published ${fileName} via Gemini AI`,
      content: encodedContent,
      branch: 'main' // Make sure your main branch is called 'main'
    })
  });

  if (githubResponse.ok) {
    console.log(`Successfully published ${fileName} to GitHub!`);
    return { statusCode: 200, body: "Success!" };
  } else {
    const errorData = await githubResponse.json();
    console.error("GitHub API Error:", errorData);
    return { statusCode: 500, body: "Failed to push to GitHub." };
  }
};

// This schedules it to run at 8:00 AM and 8:00 PM UTC every day
module.exports.handler = schedule("0 8,20 * * *", handler);