const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const Conf = require('conf');
const axios = require('axios');

const config = new Conf({
  projectName: 'thinking-md'
});

module.exports = async function init() {
  try {
    console.log(chalk.blue('\n🏢 Setting up your organization\n'));
    
    // Check if already initialized
    const existingOrg = config.get('organization');
    if (existingOrg) {
      const { action } = await inquirer.prompt([{
        type: 'list',
        name: 'action',
        message: `You're logged in as @${existingOrg.handle}. What would you like to do?`,
        choices: [
          'Continue with current organization',
          'Switch to different organization',
          'Create new organization'
        ]
      }]);
      
      if (action === 'Continue with current organization') {
        console.log(chalk.green(`✅ Using @${existingOrg.handle}`));
        return;
      }
    }
    
    // Get organization details
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'handle',
        message: 'Organization handle (e.g., acme-corp):',
        validate: (input) => {
          if (!/^[a-z0-9][a-z0-9-]{2,39}$/.test(input)) {
            return 'Handle must be lowercase, 3-40 chars, letters/numbers/hyphens';
          }
          return true;
        },
        filter: (input) => input.toLowerCase().replace('@', '')
      },
      {
        type: 'input',
        name: 'email',
        message: 'Your email:',
        validate: (input) => {
          if (!/\S+@\S+\.\S+/.test(input)) {
            return 'Please enter a valid email';
          }
          return true;
        }
      },
      {
        type: 'list',
        name: 'type',
        message: 'Organization type:',
        choices: ['company', 'personal', 'opensource']
      },
      {
        type: 'input',
        name: 'displayName',
        message: 'Display name:',
        default: (answers) => {
          return answers.handle.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
        }
      }
    ]);
    
    // TODO: In v0.2, this would create the org via API
    // For now, just save locally
    const organization = {
      handle: answers.handle,
      email: answers.email,
      type: answers.type,
      displayName: answers.displayName,
      created: new Date().toISOString()
    };
    
    // Save to global config
    config.set('organization', organization);
    
    // Create local .thinking directory
    const thinkingDir = path.join(process.cwd(), '.thinking');
    await fs.ensureDir(thinkingDir);
    await fs.ensureDir(path.join(thinkingDir, 'agents'));
    
    // Save org config locally too
    await fs.writeJson(
      path.join(thinkingDir, 'org.json'),
      organization,
      { spaces: 2 }
    );
    
    // Create organization llms.txt
    const orgLlmsTxt = `# @${answers.handle}

${answers.displayName}'s AI agents.

## Organization Info
- Type: ${answers.type}
- Created: ${new Date().toLocaleDateString()}
- Profile: https://thinking.md/@${answers.handle}

## Our Agents
No agents created yet. Use 'thinking agent create <name>' to create one.

## How to cite
Reference: @${answers.handle}/{agent-name} at thinking.md
`;
    
    await fs.writeFile(
      path.join(thinkingDir, 'llms.txt'),
      orgLlmsTxt
    );
    
    console.log(chalk.green(`\n✅ Organization @${answers.handle} created!\n`));
    console.log(chalk.white('📁 Configuration saved to:'));
    console.log(chalk.gray(`   Global: ~/.config/thinking-md/`));
    console.log(chalk.gray(`   Local: .thinking/org.json`));
    
    console.log(chalk.white('\n🚀 Next steps:'));
    console.log(chalk.cyan(`   thinking agent create my-first-bot`));
    console.log(chalk.cyan(`   thinking run "Hello world task"`));
    
    console.log(chalk.white('\n🌐 Your organization page will be:'));
    console.log(chalk.blue(`   https://thinking.md/@${answers.handle}`));
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${error.message}`));
    process.exit(1);
  }
};