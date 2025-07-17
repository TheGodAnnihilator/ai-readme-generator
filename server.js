// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// --- Middleware ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Enable parsing of JSON request bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the 'public' directory

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

if (!GOOGLE_API_KEY) {
    console.error("FATAL ERROR: GOOGLE_API_KEY is not defined in your .env file.");
    process.exit(1); // Exit the process if the key is missing
}

/**
 * A generic function to handle calls to the Gemini API.
 * @param {string} prompt - The complete prompt to send to the AI.
 * @returns {Promise<string>} The text response from the AI.
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

// Endpoint for generating the main README file
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
            prompt = `You are an expert technical writer. Your task is to follow a strict "Chain-of-Thought" process to generate a high-quality README.

            **Step 1: Deep Analysis.**
            Carefully review the provided JSON data, especially the 'description' and the code in 'code_analysis_files'. From this, you MUST infer the project's purpose, main technologies, features, and setup commands. For example, if you see 'particles.js' in the HTML, a technology is "Particles.js" and a feature is "Dynamic Animated Background". Be specific and do not use generic placeholders.
            
            **Step 2: Suggest Future Features.**
            Based on your analysis, suggest 2-3 innovative and relevant features that could be added to this project.
            
            **Step 3: Populate the Template.**
            You MUST fill in every section of the following template using the specific details you inferred in the previous steps. Do not skip any sections.

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
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});
