import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile as fsReadFile, writeFile as fsWriteFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// Dangerous commands that should be blocked
const DANGEROUS_PATTERNS = [
  /rm\s+-rf/,
  /rm\s+-r\s+/,
  /shutdown/,
  /reboot/,
  /halt/,
  /poweroff/,
  /mkfs/,
  /dd\s+if=/,
  /format\s+/,
  /del\s+\/f/,
  /format\s+c:/,
  />\/dev\/null/,
  /&amp;gt;\/dev\/null/,
];

const COMMAND_TIMEOUT = 10000; // 10 seconds
const MAX_OUTPUT_LENGTH = 3000;

/**
 * Checks if a command is safe to execute
 * @param {string} command - Command to check
 * @returns {boolean} True if safe, false otherwise
 */
function isCommandSafe(command) {
  const lowerCommand = command.toLowerCase().trim();
  
  // Check against dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(lowerCommand)) {
      return false;
    }
  }

  return true;
}

/**
 * Executes a shell command safely
 * @param {string} command - Command to execute
 * @returns {Promise<string>} Command output
 */
export async function executeCommand(command) {
  try {
    // Validate command safety
    if (!isCommandSafe(command)) {
      return '❌ Error: This command is blocked for security reasons.';
    }

    // Execute with timeout
    const { stdout, stderr } = await Promise.race([
      execAsync(command, {
        timeout: COMMAND_TIMEOUT,
        maxBuffer: 1024 * 1024, // 1MB buffer
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Command timeout')), COMMAND_TIMEOUT)
      ),
    ]);

    let output = stdout || stderr || '';
    
    // Truncate output if too long
    if (output.length > MAX_OUTPUT_LENGTH) {
      output =
        output.substring(0, MAX_OUTPUT_LENGTH) +
        `\n\n... (output truncated, ${output.length - MAX_OUTPUT_LENGTH} characters remaining)`;
    }

    return output || 'Command executed successfully (no output).';
  } catch (error) {
    if (error.message === 'Command timeout') {
      return `❌ Error: Command timed out after ${COMMAND_TIMEOUT / 1000} seconds.`;
    }
    
    const errorMessage = error.stderr || error.message || 'Unknown error occurred';
    return `❌ Error: ${errorMessage.substring(0, MAX_OUTPUT_LENGTH)}`;
  }
}

/**
 * Reads a file safely
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} File contents
 */
export async function readFile(filePath) {
  try {
    // Resolve and normalize path
    const resolvedPath = path.resolve(filePath);
    
    // Basic security: prevent directory traversal beyond reasonable limits
    // In production, you might want stricter path validation
    if (!existsSync(resolvedPath)) {
      return `❌ Error: File not found: ${filePath}`;
    }

    // Read file
    const content = await fsReadFile(resolvedPath, 'utf-8');
    
    // Truncate if too long
    if (content.length > MAX_OUTPUT_LENGTH) {
      return (
        content.substring(0, MAX_OUTPUT_LENGTH) +
        `\n\n... (file truncated, ${content.length - MAX_OUTPUT_LENGTH} characters remaining)`
      );
    }

    return content;
  } catch (error) {
    return `❌ Error reading file: ${error.message}`;
  }
}

/**
 * Creates a directory (and parent directories if needed)
 * @param {string} dirPath - Path to the directory
 * @returns {Promise<string>} Success or error message
 */
export async function createFolder(dirPath) {
  try {
    // Resolve and normalize path
    const resolvedPath = path.resolve(dirPath);
    
    // Check if already exists
    if (existsSync(resolvedPath)) {
      return `ℹ️  Directory already exists: ${dirPath}`;
    }

    // Create directory with recursive option (creates parent dirs if needed)
    await mkdir(resolvedPath, { recursive: true });
    
    return `✅ Directory created successfully: ${dirPath}`;
  } catch (error) {
    return `❌ Error creating directory: ${error.message}`;
  }
}

/**
 * Writes content to a file
 * @param {string} filePath - Path to the file
 * @param {string} content - Content to write
 * @returns {Promise<string>} Success or error message
 */
export async function writeFile(filePath, content) {
  try {
    // Resolve and normalize path
    const resolvedPath = path.resolve(filePath);
    
    // Get directory path
    const dirPath = path.dirname(resolvedPath);
    
    // Create directory if it doesn't exist
    if (!existsSync(dirPath)) {
      await mkdir(dirPath, { recursive: true });
    }

    // Write file
    await fsWriteFile(resolvedPath, content, 'utf-8');
    
    return `✅ File written successfully: ${filePath}`;
  } catch (error) {
    return `❌ Error writing file: ${error.message}`;
  }
}
