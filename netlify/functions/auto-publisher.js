const { schedule } = require("@netlify/functions");

const handler = async function(event, context) {
  console.log("Starting Auto-Publisher Cron Job...");

  // 1. The Prompt
  const prompt = `
    Act as a Senior Payments Architect. Write an ISO 20022 deep-dive article.
    Pick a random, advanced concept (e.g., pacs.004, camt.053, settlement batching, Nostro/Vostro).
    Use a 'Problem-First' approach. Use real-world physical analogies.
    
    You MUST output valid Markdown ONLY. No conversational intro/outro.
    You MUST start with this exact YAML frontmatter:
    ---
    id: "iso-${Date.now()}"
    title: "ISO 20022 Deep Dive: [Concept Name]"
    level: 300
    category: "Message Deep Dives"
    summary: "A technical breakdown of payment messaging."
    minutes: 8
    tags: ["ISO20022", "Payments"]
    ---
    
    Write the content below this frontmatter.
  `;

  // 2. Fetch from Gemini
  const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  const geminiData = await geminiResponse.json();

  // Safety Check
  if (!geminiData.candidates || geminiData.candidates.length === 0) {
    console.error("Gemini API Error:", JSON.stringify(geminiData, null, 2));
    return { statusCode: 500, body: "Gemini failed to return content." };
  }

  let articleContent = geminiData.candidates[0]?.content?.parts?.[0]?.text;
  if (!articleContent) {
    console.error("No text found in Gemini response.");
    return { statusCode: 500, body: "Gemini response empty." };
  }
  
  articleContent = articleContent.replace(/^```markdown\n/, '').replace(/\n```$/, '');

  // 3. GitHub Delivery
  const fileName = `article-${Date.now()}.md`;
  const encodedContent = Buffer.from(articleContent).toString('base64');

  const githubResponse = await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/content/${fileName}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${process.env.GITHUB_PAT}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Netlify-Auto-Publisher'
    },
    body: JSON.stringify({
      message: `Auto-published ${fileName} via Gemini`,
      content: encodedContent,
      branch: 'main'
    })
  });

  if (githubResponse.ok) {
    console.log(`Successfully published ${fileName} to GitHub!`);
    return { statusCode: 200, body: "Success!" };
  } else {
    const errorData = await githubResponse.json();
    console.error("GitHub API Error:", JSON.stringify(errorData, null, 2));
    return { statusCode: 500, body: "Failed to push to GitHub." };
  }
};

// Scheduled for 8:00 AM and 8:00 PM
module.exports.handler = schedule("0 8,20 * * *", handler);