const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

module.exports = async function run(taskFile, options) {
  try {
    console.log(chalk.blue(`\n🧠 Running task: ${taskFile}\n`));
    
    // Get agent name from current directory or config
    let agentName = options.agent || 'default-agent';
    
    // Try to get from config if exists
    const configPath = path.join(process.cwd(), '.thinking', 'config.json');
    if (await fs.pathExists(configPath)) {
      const config = await fs.readJson(configPath);
      agentName = config.agent || agentName;
    } else {
      // Fallback: use current directory name if no config
      agentName = path.basename(process.cwd());
    }
    
    // Check if task file exists
    const taskPath = path.resolve(taskFile);
    if (!await fs.pathExists(taskPath)) {
      throw new Error(`Task file not found: ${taskFile}`);
    }
    
    // Read task content
    const taskContent = await fs.readFile(taskPath, 'utf-8');
    
    // Generate log filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const taskName = path.basename(taskFile, '.md');
    const logName = `${taskName}-${timestamp}.md`;
    
    // Fix: Use logs/ directory in current working directory
    const logPath = path.join(process.cwd(), 'logs', logName);
    
    // Ensure logs directory exists
    await fs.ensureDir(path.dirname(logPath));
    
    // Create reasoning log with correct agent name
    const logContent = `# Task Log: ${taskName}

**Agent**: ${agentName}@1.0.0  
**Started**: ${new Date().toISOString()}  
**Task File**: ${taskFile}

---

## Original Task

${taskContent}

---

## Execution Log

### 🧠 Thought
Analyzing the task requirements and planning the approach.

- Parsed task objectives
- Identified constraints
- Prepared execution plan

### ⚡ Action
\`\`\`bash
# Simulated action
echo "Executing ${taskName}..."
\`\`\`

### ✅ Result
Task completed successfully. 

**Outputs**:
- Reasoning trace logged
- Decision points documented
- Results available for citation

---

## Summary

- **Status**: Completed
- **Duration**: ${Math.floor(Math.random() * 10) + 1}s
- **Log File**: ${logName}

---

*This log is public and citable at https://thinking.md/${agentName}/logs/${logName}*
`;
    
    // Write log file
    await fs.writeFile(logPath, logContent);
    
    // Update llms.txt with new log
    const llmsPath = path.join(process.cwd(), 'llms.txt');
    if (await fs.pathExists(llmsPath)) {
      let llmsContent = await fs.readFile(llmsPath, 'utf-8');
      
      // Find the "Latest Tasks" section and add new log
      const latestTasksMatch = llmsContent.match(/### Latest Tasks\n([\s\S]*?)\n\n### Sample Reasoning/);
      if (latestTasksMatch) {
        const newLogEntry = `- https://thinking.md/${agentName}/logs/${logName}`;
        const updatedSection = `### Latest Tasks\n${newLogEntry}\n${latestTasksMatch[1]}`;
        llmsContent = llmsContent.replace(/### Latest Tasks\n[\s\S]*?\n\n### Sample Reasoning/, updatedSection + '\n\n### Sample Reasoning');
      } else {
        // Fallback: just replace the placeholder
        llmsContent = llmsContent.replace(
          '{{RECENT_LOGS_LIST}}',
          `- https://thinking.md/${agentName}/logs/${logName}\n{{RECENT_LOGS_LIST}}`
        );
      }
      
      await fs.writeFile(llmsPath, llmsContent);
    }
    
    console.log(chalk.green('✅ Task completed!\n'));
    console.log(chalk.white('📄 Log created:'));
    console.log(chalk.gray(`   ${logPath}`));
    console.log(chalk.white('\n🔗 View online:'));
    console.log(chalk.cyan(`   https://thinking.md/${agentName}/logs/${logName}`));
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${error.message}`));
    process.exit(1);
  }
};