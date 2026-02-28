const OLLAMA_API_URL = 'http://localhost:11434/api/chat';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2'; // Default model

/**
 * Interprets user message and determines action using Ollama
 * @param {string} message - User's message
 * @returns {Promise<Object>} Action object with type and input
 */
export async function interpretMessage(message) {
  try {
    const systemPrompt = `You are a helpful AI assistant that can help users by:
1. Executing shell commands (use execute_command)
2. Reading files (use read_file)
3. Responding normally (use none)

You must respond ONLY with valid JSON in this exact format:
{
  "action": "execute_command" | "read_file" | "none",
  "input": "the command or file path or response text"
}

Rules:
- Use execute_command only for safe, non-destructive commands
- Use read_file for reading file contents
- Use none for normal conversation or when no action is needed
- For execute_command, provide only the command string
- For read_file, provide the file path
- For none, provide your response text

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
    if (!['execute_command', 'read_file', 'none'].includes(parsed.action)) {
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
