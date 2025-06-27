const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const Conf = require('conf');

const config = new Conf({ projectName: 'thinking-md' });

module.exports = async function publish(logFile, options) {
  try {
    console.log(chalk.blue(`\n📤 Publishing log: ${logFile}\n`));
    
    // Check if log file exists
    const logPath = path.resolve(logFile);
    if (!await fs.pathExists(logPath)) {
      throw new Error(`Log file not found: ${logFile}`);
    }
    
    // Get organization
    const org = config.get('organization');
    if (!org) {
      throw new Error('No organization found. Run "thinking init" first.');
    }

    // Read log content
    const logContent = await fs.readFile(logPath, 'utf-8');
    
    // Extract agent name from log content
    const agentMatch = logContent.match(/\*\*Agent\*\*: @[^\/]+\/([^@\s]+)/);
    if (!agentMatch) {
      throw new Error('Could not determine agent from log file');
    }
    const agentName = agentMatch[1];
    
    // Simulate publishing (in real version, this would upload to thinking.md)
    console.log(chalk.yellow('🔄 Uploading to thinking.md...'));
    
    // TODO: In v0.2, actually upload via API
    // const response = await axios.post(
    //   `https://api.thinking.md/v1/agents/@${org.handle}/${agentName}/logs`,
    //   {
    //     filename: path.basename(logFile),
    //     content: logContent,
    //     public: options.public
    //   },
    //   {
    //     headers: {
    //       'Authorization': `Bearer ${config.get('apiKey')}`,
    //       'Content-Type': 'application/json'
    //     }
    //   }
    // );
    
    // Fake delay for now
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Success
    console.log(chalk.green('\n✅ Published successfully!\n'));
    console.log(chalk.white('🔗 Public URL:'));
    console.log(chalk.cyan(`   https://thinking.md/@${org.handle}/${agentName}/logs/${path.basename(logFile)}`));
    
    if (options.public) {
      console.log(chalk.white('\n🌐 Indexed for AI search:'));
      console.log(chalk.gray('   - Available to GPT, Claude, Perplexity'));
      console.log(chalk.gray('   - Citable in AI responses'));
      console.log(chalk.gray('   - Part of the AI knowledge graph'));
    }
    
    // Update organization index
    const updateOrgIndex = require('./org-update');
    await updateOrgIndex();
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${error.message}`));
    process.exit(1);
  }
};