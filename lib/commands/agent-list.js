const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const Conf = require('conf');

const config = new Conf({ projectName: 'thinking-md' });

module.exports = async function agentList() {
  try {
    const org = config.get('organization');
    if (!org) {
      console.log(chalk.yellow('\n⚠️  No organization found'));
      console.log(chalk.gray('Run "thinking init" first\n'));
      return;
    }
    
    console.log(chalk.blue(`\n🤖 Agents for @${org.handle}\n`));
    
    const agentsDir = path.join(process.cwd(), '.thinking', 'agents');
    if (!await fs.pathExists(agentsDir)) {
      console.log(chalk.gray('No agents created yet.'));
      console.log(chalk.cyan('\nCreate one with: thinking agent create my-agent\n'));
      return;
    }
    
    const agents = await fs.readdir(agentsDir);
    if (agents.length === 0) {
      console.log(chalk.gray('No agents created yet.'));
      console.log(chalk.cyan('\nCreate one with: thinking agent create my-agent\n'));
      return;
    }
    
    for (const agent of agents) {
      const cardPath = path.join(agentsDir, agent, 'agent-card.json');
      if (await fs.pathExists(cardPath)) {
        const card = await fs.readJson(cardPath);
        const logsDir = path.join(agentsDir, agent, 'logs');
        let logCount = 0;
        
        if (await fs.pathExists(logsDir)) {
          const logs = await fs.readdir(logsDir);
          logCount = logs.filter(f => f.endsWith('.md')).length;
        }
        
        console.log(chalk.green(`• ${agent}`));
        console.log(chalk.gray(`  ${card.description}`));
        console.log(chalk.gray(`  Capabilities: ${card.capabilities.join(', ')}`));
        console.log(chalk.gray(`  Logs: ${logCount}`));
        console.log(chalk.cyan(`  https://thinking.md/@${org.handle}/${agent}\n`));
      }
    }
    
    const current = config.get('currentAgent');
    if (current) {
      console.log(chalk.gray(`Current active agent: ${current}\n`));
    }
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${error.message}`));
  }
};