const OLLAMA_API_URL = 'http://localhost:11434/api/chat';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2'; // Default model

/**
 * Interprets user message and determines action using Ollama
 * @param {string} message - User's message
 * @returns {Promise<Object>} Action object with type and input
 */
export async function interpretMessage(message) {
  try {
    const systemPrompt = `You are a powerful AI assistant that can help users by:
1. Executing shell commands (use execute_command)
2. Reading files (use read_file)
3. Creating directories/folders (use create_folder)
4. Writing files (use write_file)
5. Responding normally (use none)

You must respond ONLY with valid JSON in this exact format:
{
  "action": "execute_command" | "read_file" | "create_folder" | "write_file" | "none",
  "input": "the command, file path, directory path, or response text"
}

For write_file action, use this format:
{
  "action": "write_file",
  "input": "file_path|file_content"
}
(Use pipe | to separate file path and content)

Rules:
- Use execute_command for safe, non-destructive shell commands
- Use read_file for reading file contents (provide file path)
- Use create_folder for creating directories (provide directory path)
- Use write_file for creating/writing files (format: "path|content")
- Use none for normal conversation or when no action is needed
- For execute_command, provide only the command string
- For read_file, provide the file path
- For create_folder, provide the directory path
- For write_file, provide "file_path|file_content" (separated by pipe)
- For none, provide your response text

IMPORTANT CAPABILITIES - YOU ARE A SENIOR DEVELOPER:
- You can BUILD COMPLETE, PRODUCTION-READY APPLICATIONS
- You write CLEAN, WELL-STRUCTURED CODE with proper organization
- You follow BEST PRACTICES and coding standards
- You create FULLY FUNCTIONAL applications that work immediately
- You write code in ANY language: HTML, CSS, JavaScript, TypeScript, Python, Node.js, React, Vue, etc.
- You create proper project structures with all necessary files
- You include configuration files (package.json, requirements.txt, etc.)
- You write README files with setup instructions
- You add proper comments and documentation in code

CODE QUALITY STANDARDS:
- Write COMPLETE, WORKING code (not snippets or placeholders)
- Use modern syntax and best practices
- Include proper error handling
- Add meaningful comments where needed
- Follow language-specific conventions
- Create beautiful, modern UIs with good UX
- Make code modular and reusable
- Include all dependencies and setup instructions

WORKFLOW FOR BUILDING APPS:
When user asks to "build an app" or create something:
1. Create the project folder with proper name
2. Write ALL necessary files (HTML, CSS, JS, config files, README)
3. Make it COMPLETE and FUNCTIONAL - user should be able to run it immediately
4. Include proper project structure (separate CSS, JS files, not inline)
5. Add package.json/requirements.txt if needed
6. Create README with instructions

For web apps, create:
- index.html (complete, working HTML)
- style.css (modern, beautiful styling)
- script.js (complete functionality)
- README.md (setup and usage instructions)
- package.json (if Node.js dependencies needed)

For Python apps:
- main.py or app.py (complete script)
- requirements.txt (if dependencies needed)
- README.md (instructions)

For Node.js apps:
- package.json (with all dependencies)
- index.js or main file
- README.md
- .gitignore if needed

EXAMPLES OF COMPLETE APPS:
- "Build a calculator app" → 
  Create folder "calculator-app"
  Write complete index.html with calculator UI
  Write style.css with modern, beautiful design
  Write script.js with full calculator logic (all operations)
  Write README.md with instructions
  Result: Fully functional calculator that works immediately

- "Create a todo app" → 
  Complete HTML with input and list
  Beautiful CSS styling
  Full JavaScript with add/delete/complete functionality
  Local storage persistence
  README with usage

- "Build a weather app" → 
  Complete React/HTML structure
  API integration code
  Error handling
  Beautiful UI
  All dependencies in package.json

IMPORTANT: Always write COMPLETE, PRODUCTION-READY code. Don't write placeholders or incomplete code. The user should be able to use the app immediately after you create it.

Be cautious: Never suggest destructive commands like rm -rf, shutdown, or system-level changes.

IMPORTANT: You must respond with ONLY valid JSON, no additional text before or after.`;

    const response = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        stream: false,
        format: 'json',
        options: {
          temperature: 0.3,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.message?.content || data.response || '';

    // Try to extract JSON from response (in case model adds extra text)
    let parsed;
    try {
      // Try to find JSON object in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw response:', content);
      return {
        action: 'none',
        input: 'I received an invalid response format. Please try again.',
      };
    }

    // Validate response structure
    if (!parsed.action || !parsed.input) {
      return {
        action: 'none',
        input: 'I received an invalid response format. Please try again.',
      };
    }

    // Validate action type
    if (!['execute_command', 'read_file', 'create_folder', 'write_file', 'none'].includes(parsed.action)) {
      return {
        action: 'none',
        input: 'Invalid action type received.',
      };
    }

    return parsed;
  } catch (error) {
    console.error('AI interpretation error:', error);
    
    // Check if Ollama is running
    const errorMessage = error.message || String(error);
    if (
      error.code === 'ECONNREFUSED' ||
      errorMessage.includes('fetch failed') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('network')
    ) {
      return {
        action: 'none',
        input: '❌ Error: Cannot connect to Ollama. Please ensure Ollama is running on http://localhost:11434',
      };
    }
    
    return {
      action: 'none',
      input: 'Sorry, I encountered an error processing your request. Please try again.',
    };
  }
}
