// --- [NEW] Diagnostic Logging ---
console.log("Step 1: Starting server.js script...");

try {
    require('dotenv').config();
    console.log("Step 2: dotenv configured successfully.");
} catch (e) {
    console.error("🔴 FATAL ERROR loading dotenv:", e);
    process.exit(1);
}

const express = require('express');
console.log("Step 3: express module loaded.");

// This is a likely point of failure. We need to see if this log appears.
const fetch = require('node-fetch');
console.log("Step 4: node-fetch module loaded.");

const cors = require('cors');
console.log("Step 5: cors module loaded.");

const path = require('path');
console.log("Step 6: path module loaded.");


const app = express();
const PORT = 3000;

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
console.log("Step 7: Express middleware configured.");


// --- API Key Check ---
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

if (!GOOGLE_API_KEY || GOOGLE_API_KEY === "YOUR_API_KEY_HERE") {
    console.error("\n🔴 FATAL ERROR: Your Google AI API key is missing from the .env file!");
    process.exit(1);
} else {
    console.log("Step 8: Successfully loaded Google AI API key.");
}


/**
 * A generic function to handle calls to the Gemini API.
 */
async function callGeminiAPI(prompt) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`;
    
    const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }]
    };

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Gemini API Error:", errorBody);
        throw new Error(`AI generation failed with status ${response.status}.`);
    }

    const result = await response.json();
    
    if (result.candidates && result.candidates[0].content.parts[0].text) {
        let text = result.candidates[0].content.parts[0].text;
        if (text.startsWith('```markdown')) text = text.substring(10);
        if (text.endsWith('```')) text = text.substring(0, text.length - 3);
        return text.trim();
    } else {
        if (result.promptFeedback && result.promptFeedback.blockReason) {
             throw new Error(`Request was blocked by the AI for safety reasons: ${result.promptFeedback.blockReason}`);
        }
        throw new Error("The AI returned an empty or invalid response.");
    }
}


// --- API Endpoints ---
app.post('/api/generate-readme', async (req, res) => {
    try {
        const { repoData, examples, feedback } = req.body;

        const strictTemplate = `
# ${repoData.name}
> [A concise and powerful one-liner describing the project.]
[![License: ${repoData.license || 'N/A'}](https://img.shields.io/badge/License-${(repoData.license || 'N/A').replace(/ /g, '%20')}-yellow.svg)](${repoData.url})
[![GitHub stars](https://img.shields.io/github/stars/${repoData.url.split('/').slice(-2).join('/')}?style=social)](${repoData.url})
## Description
[A detailed paragraph about the project's purpose and functionality.]
## ✨ Key Features
- [Feature 1]
- [Feature 2]
- [Feature 3]
## 🛠️ Technology Stack
- **Frontend:** [List technologies]
- **Backend:** [List technologies]
## 🚀 Getting Started
### Prerequisites
- [List prerequisites]
### Installation
1. \`git clone ${repoData.url}\`
2. \`cd ${repoData.name}\`
3. \`[Installation command]\`
### Running the Project
\`\`\`sh
[Run command]
\`\`\`
## 🔮 Future Features
- [A suggestion for a future feature.]
- [Another suggestion for a future feature.]
## 🤝 Contributing
Contributions are welcome! Please check the [issues page](${repoData.url}/issues).
## 📝 License
This project is licensed under the **${repoData.license || 'Not specified'}**.`;

        let prompt;
        if (feedback) {
            prompt = `The previous README was not good enough. You MUST improve it based on this user feedback: "${feedback}". You MUST follow the provided template structure. TEMPLATE: ${strictTemplate} ORIGINAL DATA: ${JSON.stringify(repoData, null, 2)} Output only the raw Markdown content.`;
        } else {
            const examplesString = examples.length > 0 ? `Here are some high-quality examples of READMEs for similar projects:\n\n` + examples.map((ex, i) => `--- EXAMPLE ${i + 1} ---\n${ex}`).join('\n\n') : "No relevant examples found.";
            prompt = `You are an expert technical writer. Your task is to populate the provided Markdown template.
            **Step 1: Analyze the Data.** Carefully review the provided JSON data, especially the 'description' and the code in 'code_analysis_files'.
            **Step 2: Infer the Details.** From your analysis, determine the project's features, technology stack, setup commands, and suggest 2-3 innovative future features.
            **Step 3: Populate the Template.** You MUST fill in every section of the following template using the details you inferred. Do not skip any sections.
            ---
            **TEMPLATE TO POPULATE:**
            ---
            ${strictTemplate}
            ---
            **JSON DATA TO USE:**
            ---
            ${JSON.stringify(repoData, null, 2)}
            ---
            Now, generate the complete, populated README.md file. Output only the raw markdown.`;
        }

        const readmeContent = await callGeminiAPI(prompt);
        res.json({ content: readmeContent });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// --- Server Initialization ---
app.listen(PORT, () => {
    console.log(`\n✅ Server is running on http://localhost:${PORT}`);
    console.log("You can now open this address in your web browser.");
});
