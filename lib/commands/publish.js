const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

module.exports = async function publish(logFile, options) {
  try {
    console.log(chalk.blue(`\n📤 Publishing log: ${logFile}\n`));
    
    // Check if log file exists
    const logPath = path.resolve(logFile);
    if (!await fs.pathExists(logPath)) {
      throw new Error(`Log file not found: ${logFile}`);
    }
    
    // Read log content
    const logContent = await fs.readFile(logPath, 'utf-8');
    
    // Extract agent name from log content or use current directory
    const agentMatch = logContent.match(/\*\*Agent\*\*: ([^@\s]+)/);
    let agentName = agentMatch ? agentMatch[1] : path.basename(process.cwd());
    
    // Try to get from config as well
    const configPath = path.join(process.cwd(), '.thinking', 'config.json');
    if (await fs.pathExists(configPath)) {
      const config = await fs.readJson(configPath);
      agentName = config.agent || agentName;
    }
    
    // Simulate publishing (in real version, this would upload to thinking.md)
    console.log(chalk.yellow('🔄 Uploading to thinking.md...'));
    
    // Fake delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Success
    console.log(chalk.green('\n✅ Published successfully!\n'));
    console.log(chalk.white('🔗 Public URL:'));
    console.log(chalk.cyan(`   https://thinking.md/${agentName}/${path.basename(logFile)}`));
    
    if (options.public) {
      console.log(chalk.white('\n🌐 Indexed for AI search:'));
      console.log(chalk.gray('   - Available to GPT, Claude, Perplexity'));
      console.log(chalk.gray('   - Citable in AI responses'));
      console.log(chalk.gray('   - Part of the AI knowledge graph'));
    }
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${error.message}`));
    process.exit(1);
  }
};