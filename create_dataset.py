import requests
import json
import time
import base64
import os

# --- Configuration ---
# IMPORTANT: Replace with your own GitHub Personal Access Token to avoid strict rate limits.
# You can generate one here: https://github.com/settings/tokens
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN', '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') 
LANGUAGES = ["JavaScript", "Python", "Java", "Go", "TypeScript"]
MIN_STARS = 5000
REPOS_PER_LANGUAGE = 20 # The number of repos to fetch for each language.
OUTPUT_FILE = "readme_dataset.json"

# --- Helper Functions ---

def get_headers():
    """Returns the authorization headers for the GitHub API."""
    if GITHUB_TOKEN != 'YOUR_GITHUB_TOKEN_HERE':
        return {"Authorization": f"token {GITHUB_TOKEN}"}
    print("Warning: Running without a GitHub API token. You may hit rate limits quickly.")
    return {}

def search_repositories(language, page):
    """Searches GitHub for repositories matching the criteria."""
    print(f"Searching for {language} repositories (Page {page})...")
    # Construct the search query
    query = f"stars:>{MIN_STARS} language:{language} in:name,description,readme"
    url = f"https://api.github.com/search/repositories?q={query}&sort=stars&order=desc&per_page={REPOS_PER_LANGUAGE}&page={page}"
    
    try:
        response = requests.get(url, headers=get_headers())
        response.raise_for_status() # Raises an exception for bad status codes (4xx or 5xx)
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error searching repositories: {e}")
        # Check for rate limit error
        if response.status_code == 403:
            print("Rate limit likely exceeded. Please add a GitHub token or wait an hour.")
        return None

def get_file_content(repo_full_name, path):
    """Fetches the decoded content of a specific file from a repository."""
    url = f"https://api.github.com/repos/{repo_full_name}/contents/{path}"
    try:
        response = requests.get(url, headers=get_headers())
        if response.status_code == 200:
            content_encoded = response.json().get('content', '')
            # Decode the base64 encoded content
            return base64.b64decode(content_encoded).decode('utf-8', 'ignore')
        return None
    except requests.exceptions.RequestException:
        return None

def get_repo_contents(repo_full_name):
    """Gets the list of files and directories in the root of a repository."""
    url = f"https://api.github.com/repos/{repo_full_name}/contents/"
    try:
        response = requests.get(url, headers=get_headers())
        if response.status_code == 200:
            return response.json()
        return []
    except requests.exceptions.RequestException:
        return []


# --- Main Script Logic ---

def create_dataset():
    """Main function to create the dataset."""
    final_dataset = []
    
    for lang in LANGUAGES:
        print(f"\n--- Processing Language: {lang} ---")
        
        search_results = search_repositories(lang, page=1)
        
        if not search_results or 'items' not in search_results:
            print(f"Could not fetch repositories for {lang}. Skipping.")
            continue
            
        repos = search_results['items']
        
        for i, repo in enumerate(repos):
            repo_full_name = repo['full_name']
            print(f"\n({i+1}/{len(repos)}) Processing repo: {repo_full_name}")
            
            # 1. Get README content
            readme_content = get_file_content(repo_full_name, "README.md")
            if not readme_content:
                print(f"  - Could not find or fetch README.md. Skipping repo.")
                continue

            # 2. Get key file contents
            repo_files = get_repo_contents(repo_full_name)
            key_filenames = ['package.json', 'requirements.txt', 'pom.xml', 'index.js', 'main.py', 'app.js']
            source_code_snippets = []
            
            for file_info in repo_files:
                if file_info['name'] in key_filenames:
                    print(f"  - Found key file: {file_info['name']}. Fetching content...")
                    content = get_file_content(repo_full_name, file_info['path'])
                    if content:
                        source_code_snippets.append({
                            "file_name": file_info['name'],
                            "content": content
                        })
            
            # 3. Structure the data as per the plan
            repo_data = {
                "repo_name": repo_full_name,
                "language": repo.get('language'),
                "stars": repo.get('stargazers_count'),
                "description": repo.get('description'),
                "source_code_snippets": source_code_snippets,
                "readme_content": readme_content
            }
            
            final_dataset.append(repo_data)
            
            # Respect rate limits by adding a small delay
            time.sleep(2) 

    # 4. Save the final dataset to a JSON file
    print(f"\n--- Saving dataset with {len(final_dataset)} entries to {OUTPUT_FILE} ---")
    try:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(final_dataset, f, indent=2, ensure_ascii=False)
        print("Dataset created successfully!")
    except IOError as e:
        print(f"Error writing to file: {e}")

if __name__ == "__main__":
    create_dataset()
