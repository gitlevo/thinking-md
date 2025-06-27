const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const Conf = require('conf');

const config = new Conf({ projectName: 'thinking-md' });

module.exports = async function createAgent(agentName) {
  try {
    // Check if org exists
    const org = config.get('organization');
    if (!org) {
      console.error(chalk.red('❌ No organization found. Run "thinking init" first.'));
      process.exit(1);
    }
    
    console.log(chalk.blue(`\n🤖 Creating agent: @${org.handle}/${agentName}\n`));
    
    // Get agent details
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'description',
        message: 'Agent description:',
        default: `${agentName} agent for @${org.handle}`
      },
      {
        type: 'input',
        name: 'capabilities',
        message: 'Agent capabilities (comma-separated):',
        default: 'reasoning, planning, execution',
        filter: (input) => input.split(',').map(cap => cap.trim())
      }
    ]);
    
    // Create agent directory structure
    const agentDir = path.join(process.cwd(), '.thinking', 'agents', agentName);
    await fs.ensureDir(agentDir);
    await fs.ensureDir(path.join(agentDir, 'logs'));
    await fs.ensureDir(path.join(agentDir, 'tasks'));
    
    // Create agent-card.json with A2A compliance
    const agentCard = {
      name: agentName,
      organization: `@${org.handle}`,
      version: "1.0.0",
      description: answers.description,
      author: org.email,
      capabilities: answers.capabilities,
      
      // A2A Protocol compliance
      "a2a": {
        "version": "1.0",
        "protocol": "https",
        "endpoints": {
          "discovery": `https://api.thinking.md/v1/agents/@${org.handle}/${agentName}`,
          "capabilities": `https://api.thinking.md/v1/agents/@${org.handle}/${agentName}/capabilities`,
          "execute": `https://api.thinking.md/v1/agents/@${org.handle}/${agentName}/execute`
        },
        "authentication": {
          "type": "bearer",
          "required": false
        },
        "capabilities_detail": answers.capabilities.map(cap => ({
          "name": cap,
          "description": `${cap} capability`,
          "input_schema": {},
          "output_schema": {}
        }))
      },
      
      // thinking.md specific
      "thinking_md": {
        "profile": `https://thinking.md/@${org.handle}/${agentName}`,
        "logs": `https://thinking.md/@${org.handle}/${agentName}/logs`,
        "llms": `https://thinking.md/@${org.handle}/${agentName}/llms.txt`
      },
      
      "metadata": {
        "created": new Date().toISOString(),
        "organization": org.displayName,
        "type": "thinking-md-agent",
        "standards": ["a2a/1.0", "llms.txt/1.0"]
      }
    };
    
    await fs.writeJson(
      path.join(agentDir, 'agent-card.json'),
      agentCard,
      { spaces: 2 }
    );
    
    // Create agent config
    const agentConfig = {
      name: agentName,
      organization: `@${org.handle}`,
      created: new Date().toISOString(),
      active: true
    };
    
    await fs.writeJson(
      path.join(agentDir, 'config.json'),
      agentConfig,
      { spaces: 2 }
    );
    
    // Create agent llms.txt
    const llmsTxt = `# @${org.handle}/${agentName}

${answers.description}

Part of ${org.displayName}'s AI agent ecosystem.

## Agent Information
- **Organization**: @${org.handle}
- **Agent**: ${agentName}
- **Version**: 1.0.0
- **Profile**: https://thinking.md/@${org.handle}/${agentName}

## Capabilities
${answers.capabilities.map(cap => `- ${cap}`).join('\n')}

## Recent Logs
View all logs at: https://thinking.md/@${org.handle}/${agentName}/logs/

## How to cite
Reference: @${org.handle}/${agentName} at thinking.md

## A2A Endpoints
- Discovery: https://api.thinking.md/v1/agents/@${org.handle}/${agentName}
- Execute: https://api.thinking.md/v1/agents/@${org.handle}/${agentName}/execute
`;
    
    await fs.writeFile(
      path.join(agentDir, 'llms.txt'),
      llmsTxt
    );
    
    // Create sample task
    const sampleTask = `# Sample Task

## Context
This is a sample task for ${agentName}.

## Objective
Demonstrate the thinking.md format.

## Expected Output
A reasoning log showing the thought process.
`;
    
    await fs.writeFile(
      path.join(agentDir, 'tasks', 'sample-task.md'),
      sampleTask
    );
    
    // Update current agent in config
    config.set('currentAgent', agentName);
    
    // Update organization index
    const updateOrgIndex = require('./org-update');
    await updateOrgIndex();
    
    console.log(chalk.green(`\n✅ Agent created: @${org.handle}/${agentName}\n`));
    console.log(chalk.white('📁 Created structure:'));
    console.log(chalk.gray(`   .thinking/agents/${agentName}/
   ├── agent-card.json    # A2A compliant identity
   ├── config.json        # Local config
   ├── llms.txt          # AI-readable index
   ├── logs/             # Reasoning logs
   └── tasks/            # Task definitions
       └── sample-task.md`));
    
    console.log(chalk.white('\n🚀 Next steps:'));
    console.log(chalk.cyan(`   thinking run "Your first task"`));
    console.log(chalk.cyan(`   thinking browse @${org.handle}/${agentName}`));
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${error.message}`));
    process.exit(1);
  }
};