
# ai-readme-generator

> A backend server that leverages the Gemini API to automatically generate README files for GitHub repositories based on code analysis.

[![License: Not specified](https://img.shields.io/badge/License-Not%20specified-yellow.svg)](https://github.com/TheGodAnnihilator/ai-readme-generator)
[![GitHub stars](https://img.shields.io/github/stars/TheGodAnnihilator/ai-readme-generator?style=social)](https://github.com/TheGodAnnihilator/ai-readme-generator)

## Description

This project is a backend server designed to automate the creation of README files for GitHub repositories. It utilizes the Google Gemini API to analyze repository metadata and code, generating comprehensive and informative README content. The server exposes an API endpoint `/api/generate-readme` that accepts repository data and generates a README file in Markdown format. It addresses the problem of manually creating README files, saving developers time and effort. The core purpose is to provide an automated solution for documenting software projects.

## ✨ Key Features

- **README Generation via Gemini API:** Generates README content by sending repository information to the Gemini API and formatting the response in Markdown.
- **Customizable README Template:** Uses a predefined template with sections for description, features, technology stack, getting started, contributing, and license, ensuring consistency.
- **Feedback-Driven Refinement:** Allows users to provide feedback on generated READMEs, enabling iterative improvements via the Gemini API.

## 🛠️ Technology Stack

- **Frontend:** None (Backend-only project, but likely intended to be consumed by a frontend application)
- **Backend:** Node.js, Express, CORS, dotenv, node-fetch
- **Database:** None

## 🚀 Getting Started

### Prerequisites

- Node.js v16+ (due to the use of `node-fetch` version 2.6.7)
- npm (Node Package Manager)
- Google Cloud Account with access to the Gemini API and an API Key
- .env file with `GOOGLE_API_KEY` defined

### Installation

1.  Clone the repository:
    ```sh
    git clone https://github.com/TheGodAnnihilator/ai-readme-generator
    ```
2.  Navigate to the project directory:
    ```sh
    cd ai-readme-generator
    ```
3.  Install dependencies:
    ```sh
    npm install
    ```
                
### Running the Project
```sh
npm start
```

## 🔮 Future Features

- **Integration with GitHub API:** Automatically fetch repository data directly from GitHub using the GitHub API.
- **GUI for README Customization:** Develop a user interface to allow users to customize the README template and content before generation.

## 🤝 Contributing

Contributions are welcome! Please check the [issues page](https://github.com/TheGodAnnihilator/ai-readme-generator/issues) for ways to contribute.

## 📝 License

This project is licensed under the **Not specified**.
