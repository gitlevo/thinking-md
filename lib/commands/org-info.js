const chalk = require('chalk');
const Conf = require('conf');
const fs = require('fs-extra');
const path = require('path');

const config = new Conf({ projectName: 'thinking-md' });

module.exports = async function orgInfo() {
  const org = config.get('organization');
  
  if (!org) {
    console.log(chalk.yellow('\n⚠️  No organization found'));
    console.log(chalk.gray('Run "thinking init" to set up your organization\n'));
    return;
  }
  
  console.log(chalk.blue('\n🏢 Current Organization\n'));
  console.log(chalk.white(`Handle: @${org.handle}`));
  console.log(chalk.gray(`Display: ${org.displayName}`));
  console.log(chalk.gray(`Type: ${org.type}`));
  console.log(chalk.gray(`Email: ${org.email}`));
  console.log(chalk.gray(`Created: ${new Date(org.created).toLocaleDateString()}`));
  
  // Count agents
  const agentsDir = path.join(process.cwd(), '.thinking', 'agents');
  let agentCount = 0;
  if (await fs.pathExists(agentsDir)) {
    const agents = await fs.readdir(agentsDir);
    agentCount = agents.length;
  }
  
  console.log(chalk.gray(`Agents: ${agentCount}`));
  console.log(chalk.cyan(`\nProfile: https://thinking.md/@${org.handle}\n`));
};