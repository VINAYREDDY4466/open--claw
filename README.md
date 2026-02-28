# Personal AI Agent

A secure, local AI agent controlled through Telegram that can execute shell commands and read files based on AI interpretation.

## Features

- 🔐 **Secure**: Only authorized users can access the bot
- 🤖 **AI-Powered**: Uses Ollama local AI to interpret user requests
- 🛠️ **Tool System**: Can execute commands and read files
- ⚡ **Fast**: Local execution with timeout protection
- 🛡️ **Safe**: Blocks dangerous commands automatically
- 🏠 **Local**: Runs completely locally, no external API keys needed

## Prerequisites

- Node.js (LTS version recommended)
- npm or yarn
- Telegram Bot Token (from [@BotFather](https://t.me/botfather))
- Ollama installed and running locally ([Download Ollama](https://ollama.ai/))

## Setup

### 1. Install Ollama

1. **Download and install Ollama** from [ollama.ai](https://ollama.ai/)
   - This installs the Ollama application only (no models included)

2. **Pull a model** (required - models are not included with installation):
   
   **On Windows** (if `ollama` command is not recognized):
   ```powershell
   # Use full path to ollama.exe
   & "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe" pull llama3.2
   ```
   
   **Or if `ollama` is in your PATH**:
   ```bash
   ollama pull llama3.2
   ```
   
   **Important Notes**:
   - You can run this command from **any directory** - it doesn't matter where you are
   - Models are stored in Ollama's data directory, not your current folder
   - This downloads the model to your local machine
   - You can use any model: `llama3.2`, `mistral`, `codellama`, etc.
   - First download may take a few minutes depending on model size

3. **Verify Ollama is installed and running**:
   - **Check if installed**: Look for `C:\Users\<YourUsername>\AppData\Local\Programs\Ollama\ollama.exe`
   - **Check if running**: Open http://localhost:11434 in your browser (should show Ollama API info)
   - **List installed models**:
     ```powershell
     # Windows (full path)
     & "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe" list
     
     # Or if in PATH
     ollama list
     ```

### 2. Clone or Download the Project

```bash
cd "C:\Open claw"
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```env
BOT_TOKEN=your_telegram_bot_token_here
OWNER_ID=your_telegram_user_id_here
OLLAMA_MODEL=llama3.2
```

**Note**: `OLLAMA_MODEL` is optional (defaults to `llama3.2`). Use any model you have installed in Ollama.

#### How to Get Your Credentials:

1. **BOT_TOKEN**: 
   - Message [@BotFather](https://t.me/botfather) on Telegram
   - Send `/newbot` and follow instructions
   - Copy the token provided

2. **OWNER_ID**:
   - Message [@userinfobot](https://t.me/userinfobot) on Telegram
   - It will reply with your user ID
   - Copy the ID (numeric value)

3. **OLLAMA_MODEL** (optional):
   - List available models: `ollama list`
   - Use any model name you have installed (e.g., `llama3.2`, `mistral`, `codellama`)

### 5. Run the Bot

```bash
npm start
```

Or:

```bash
node index.js
```

You should see:
```
✅ Bot initialized successfully
✅ Authorized user ID: 123456789
🚀 Personal AI Agent is running...
```

## Usage

1. Open Telegram and find your bot
2. Send a message to the bot
3. The AI will interpret your message and:
   - Execute a shell command if needed
   - Read a file if requested
   - Respond normally for conversation

### Example Messages

- "List files in current directory" → Executes `ls` or `dir`
- "Read package.json" → Reads the file
- "What's the weather?" → Normal AI response
- "Show me the contents of README.md" → Reads the file

## Security Features

- ✅ Only authorized user (OWNER_ID) can use the bot
- ✅ Dangerous commands are blocked (rm -rf, shutdown, etc.)
- ✅ Command execution timeout: 10 seconds
- ✅ Output length limit: 3000 characters
- ✅ File path validation

## Project Structure

```
.
├── index.js              # Main entry point
├── services/
│   ├── ai.js            # Ollama integration
│   └── tools.js         # Command execution & file reading
├── .env                 # Environment variables (create this)
├── .env.example         # Environment template
├── package.json         # Dependencies
└── README.md           # This file
```

## Troubleshooting

### Bot not responding
- Check that BOT_TOKEN is correct
- Verify the bot is running (check console output)
- Ensure you're messaging the correct bot

### "Access denied" message
- Verify OWNER_ID matches your Telegram user ID
- Check that .env file has correct OWNER_ID value

### Ollama connection errors
- Ensure Ollama is running: Check http://localhost:11434 in your browser
- Verify the model exists: Run `ollama list` to see installed models
- Start Ollama service if it's not running
- Check that OLLAMA_MODEL in .env matches an installed model name

### Command execution errors
- Some commands may be blocked for security
- Check command syntax
- Commands timeout after 10 seconds

## Notes

- The bot runs locally on your machine
- Commands execute in the same directory where you run the bot
- File paths are relative to the bot's working directory
- Long outputs are truncated to 3000 characters

## License

MIT
