const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');

// Template processing function
const processTemplate = (template, replacements) => {
  let processed = template;
  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processed = processed.replace(regex, value);
  }
  return processed;
};

module.exports = async function init(agentName, options) {
  try {
    console.log(chalk.blue(`\n🤖 Initializing agent: ${agentName}\n`));
    
    // Create agent directory
    const agentDir = path.join(process.cwd(), agentName);
    
    // Check if already exists
    if (await fs.pathExists(agentDir)) {
      const { overwrite } = await inquirer.prompt([{
        type: 'confirm',
        name: 'overwrite',
        message: `Directory ${agentName} already exists. Overwrite?`,
        default: false
      }]);
      
      if (!overwrite) {
        console.log(chalk.yellow('Initialization cancelled.'));
        return;
      }
    }
    
    await fs.ensureDir(agentDir);
    await fs.ensureDir(path.join(agentDir, 'logs'));
    await fs.ensureDir(path.join(agentDir, 'tasks'));
    await fs.ensureDir(path.join(agentDir, '.thinking')); // ADD THIS LINE
    
    // Get additional info if not provided
    let description = options.description;
    let capabilities = options.capabilities;
    
    if (!description || !capabilities) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'description',
          message: 'Agent description:',
          default: `${agentName} agent for thinking.md`,
          when: !description
        },
        {
          type: 'input',
          name: 'capabilities',
          message: 'Agent capabilities (comma-separated):',
          default: 'reasoning, planning, execution',
          when: !capabilities,
          filter: (input) => input.split(',').map(cap => cap.trim())
        }
      ]);
      
      description = description || answers.description;
      capabilities = capabilities || answers.capabilities;
    }
    
    // Ensure capabilities is an array
    if (!Array.isArray(capabilities)) {
      capabilities = capabilities.split(',').map(cap => cap.trim());
    }
    
    // Template directory path
    const templatePath = path.join(__dirname, '../../templates');
    
    // Common replacements for all templates
    const replacements = {
      AGENT_NAME: agentName,
      DESCRIPTION: description,
      AUTHOR: process.env.USER || 'anonymous',
      TIMESTAMP: new Date().toISOString(),
      VERSION: '1.0.0',
      CREATED_DATE: new Date().toLocaleDateString(),
      CREATED: new Date().toLocaleDateString(),
      CAPABILITIES_LIST: capabilities.map(cap => `- ${cap}`).join('\n'),
      CAPABILITIES_DESCRIPTION: capabilities.map(cap => `- **${cap}** - ${cap} capabilities for transparent operation`).join('\n'),
      KEYWORDS_LIST: ['ai-agent', agentName, ...capabilities].join(', '),
      LICENSE: 'MIT',
      A2A_STATUS: 'supports',
      PUBLIC_STATUS: 'Yes',
      INDEXED_STATUS: 'Yes',
      API_ENDPOINT_INFO: `https://api.thinking.md/agents/${agentName}`,
      WEBHOOK_INFO: 'Webhook support coming soon',
      LAST_UPDATED: new Date().toISOString(),
      TOTAL_LOGS: '0',
      RECENT_LOGS_LIST: '- No logs yet. Run your first task!',
      RECENT_LOGS: '- No logs yet. Run your first task!'
    };
    
    // Process agent-card.json
    const agentCardTemplate = await fs.readFile(
      path.join(templatePath, 'agent-card.json'), 
      'utf-8'
    );
    
    // Special handling for agent-card.json (it's JSON)
    let agentCardProcessed = processTemplate(agentCardTemplate, replacements);
    // Parse and re-stringify to ensure valid JSON
    const agentCard = JSON.parse(agentCardProcessed);
    // Set capabilities array properly
    agentCard.capabilities = capabilities;
    
    await fs.writeJson(
      path.join(agentDir, 'agent-card.json'), 
      agentCard, 
      { spaces: 2 }
    );
    
    // Process llms.txt
    const llmsTxtTemplate = await fs.readFile(
      path.join(templatePath, 'llms.txt'), 
      'utf-8'
    );
    
    const llmsTxt = processTemplate(llmsTxtTemplate, replacements);
    await fs.writeFile(
      path.join(agentDir, 'llms.txt'),
      llmsTxt
    );
    
    // Process README.md
    const readmeTemplate = await fs.readFile(
      path.join(templatePath, 'README-template.md'), 
      'utf-8'
    );
    
    const readme = processTemplate(readmeTemplate, replacements);
    await fs.writeFile(
      path.join(agentDir, 'README.md'),
      readme
    );
    
    // Process task template as sample-task.md
    const taskTemplate = await fs.readFile(
      path.join(templatePath, 'task-template.md'), 
      'utf-8'
    );
    
    // Special replacements for sample task
    const sampleTaskReplacements = {
      ...replacements,
      TASK_NAME: 'Sample Task',
      DATE: new Date().toISOString(),
      TASK_ID: `sample-${Date.now()}`,
      CONTEXT_DESCRIPTION: `This is a sample task for ${agentName} to demonstrate the thinking.md format.`,
      OBJECTIVE_DESCRIPTION: 'Demonstrate transparent reasoning and decision logging.',
      CONSTRAINT_1: 'Use markdown format',
      CONSTRAINT_2: 'Include reasoning traces',
      CONSTRAINT_3: 'Be transparent',
      INPUT_DATA: 'Sample input data for demonstration',
      REASONING_STEPS: `1. Analyzing the task requirements
2. Planning the approach
3. Executing the plan
4. Documenting the results`,
      ANALYSIS_DETAILS: 'This section would contain detailed analysis of the problem.',
      COMMAND_OR_ACTION: '# Example command\necho "Executing task..."',
      TIME: new Date().toLocaleTimeString(),
      DECISION: 'Proceed with task',
      REASON: 'All requirements met',
      CONF: '95',
      RESULTS_DESCRIPTION: 'Task completed successfully with full transparency.',
      OUTPUT_DATA: 'Sample output demonstrating successful completion',
      STATUS: 'Completed',
      DURATION: '0m 0s',
      TOKENS: '0',
      CONFIDENCE: '95',
      KEY_LEARNINGS: '- Transparent logging improves trust\n- Markdown format is readable for humans and LLMs',
      RECOMMENDED_ACTIONS: '- Run more complex tasks\n- Review the generated logs',
      LOG_ID: `sample-${Date.now()}`
    };
    
    const sampleTask = processTemplate(taskTemplate, sampleTaskReplacements);
    await fs.writeFile(
      path.join(agentDir, 'tasks', 'sample-task.md'),
      sampleTask
    );
    
    // Create a simple .gitignore
    const gitignore = `# thinking.md
.env
.DS_Store
node_modules/
*.log
.thinking/
`;
    
    await fs.writeFile(
      path.join(agentDir, '.gitignore'),
      gitignore
    );
    
    // Create initial config
    const config = {
      agent: agentName,
      version: '1.0.0',
      thinking_md: {
        auto_publish: false,
        public_by_default: true,
        log_format: 'markdown',
        profile_url: `https://thinking.md/${agentName}`
      }
    };
    
    await fs.writeJson(
      path.join(agentDir, '.thinking', 'config.json'),
      config,
      { spaces: 2 }
    );
    
    // Success message
    console.log(chalk.green('\n✅ Agent initialized successfully!\n'));
    console.log(chalk.white('📁 Created structure:'));
    console.log(chalk.gray(`   ${agentName}/
   ├── agent-card.json      # Agent identity
   ├── llms.txt            # AI-readable index
   ├── README.md           # Documentation
   ├── .gitignore          # Git ignore file
   ├── .thinking/          # Config directory
   │   └── config.json     # Agent config
   ├── logs/               # Reasoning logs (empty)
   └── tasks/              # Task definitions
       └── sample-task.md  # Example task`));
    
    console.log(chalk.white('\n🚀 Next steps:'));
    console.log(chalk.cyan(`   cd ${agentName}`));
    console.log(chalk.cyan(`   thinking run tasks/sample-task.md`));
    console.log(chalk.cyan(`   thinking publish logs/*.md`));
    
    console.log(chalk.white('\n🌐 Your agent will be available at:'));
    console.log(chalk.blue(`   https://thinking.md/${agentName}`));
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${error.message}`));
    console.error(chalk.gray(error.stack));
    process.exit(1);
  }
};