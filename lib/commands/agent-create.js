const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const Conf = require('conf');

const config = new Conf({ projectName: 'thinking-md' });

// Template processing function
const processTemplate = (template, replacements) => {
  let processed = template;
  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processed = processed.replace(regex, value);
  }
  return processed;
};

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
    
    // Template directory
    const templateDir = path.join(__dirname, '../../templates');
    
    // Prepare template replacements
    const replacements = {
      AGENT_NAME: agentName,
      ORG_HANDLE: org.handle,
      ORG_DISPLAY_NAME: org.displayName,
      ORG_TYPE: org.type,
      DESCRIPTION: answers.description,
      VERSION: '1.0.0',
      AUTHOR: org.email,
      CREATED_DATE: new Date().toLocaleDateString(),
      TIMESTAMP: new Date().toISOString(),
      CAPABILITIES_LIST: answers.capabilities.map(cap => `- ${cap}`).join('\n'),
      CAPABILITIES_JSON: JSON.stringify(answers.capabilities),
      CAPABILITIES_DETAIL_JSON: JSON.stringify(
        answers.capabilities.map(cap => ({
          name: cap,
          description: `${cap} capability`,
          input_schema: {},
          output_schema: {}
        }))
      ),
      RECENT_LOGS_LIST: 'No logs yet. Run your first task with: thinking run "your task"',
      A2A_STATUS: 'supports',
      A2A_AUTH_TYPE: 'Bearer token (optional)',
      API_ENDPOINT_INFO: `https://api.thinking.md/v1/agents/@${org.handle}/${agentName}`,
      WEBHOOK_INFO: 'Webhook support coming soon',
      PUBLIC_STATUS: 'Yes',
      INDEXED_STATUS: 'Yes',
      LAST_UPDATED: new Date().toISOString(),
      TOTAL_LOGS: '0',
      FIRST_LOG_DATE: 'Not yet',
      LATEST_LOG_DATE: 'Not yet',
      AVG_RESPONSE_TIME: 'N/A',
      SUCCESS_RATE: 'N/A',
      TOTAL_TASKS: '0',
      KEYWORDS_LIST: ['ai-agent', agentName, org.handle, ...answers.capabilities].join(', '),
      RELATED_AGENTS_LIST: `- Check https://thinking.md/@${org.handle} for full list`,
      LICENSE: 'MIT'
    };
    
    // Process agent-card.json template
    if (await fs.pathExists(path.join(templateDir, 'agent-card.json'))) {
      const agentCardTemplate = await fs.readFile(
        path.join(templateDir, 'agent-card.json'),
        'utf-8'
      );
      const agentCardContent = processTemplate(agentCardTemplate, replacements);
      const agentCard = JSON.parse(agentCardContent);
      
      await fs.writeJson(
        path.join(agentDir, 'agent-card.json'),
        agentCard,
        { spaces: 2 }
      );
    } else {
      // Fallback if template doesn't exist
      const agentCard = {
        name: agentName,
        organization: `@${org.handle}`,
        version: "1.0.0",
        description: answers.description,
        author: org.email,
        capabilities: answers.capabilities,
        
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
    }
    
    // Process llms.txt template
    if (await fs.pathExists(path.join(templateDir, 'llms.txt'))) {
      const llmsTemplate = await fs.readFile(
        path.join(templateDir, 'llms.txt'),
        'utf-8'
      );
      const llmsTxt = processTemplate(llmsTemplate, replacements);
      
      await fs.writeFile(
        path.join(agentDir, 'llms.txt'),
        llmsTxt
      );
    }
    
    // Process task template
    if (await fs.pathExists(path.join(templateDir, 'task-template.md'))) {
      const taskTemplate = await fs.readFile(
        path.join(templateDir, 'task-template.md'),
        'utf-8'
      );
      
      // Special replacements for sample task
      const taskReplacements = {
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
      
      const sampleTask = processTemplate(taskTemplate, taskReplacements);
      
      await fs.writeFile(
        path.join(agentDir, 'tasks', 'sample-task.md'),
        sampleTask
      );
    }
    
    // Process README template if exists
    if (await fs.pathExists(path.join(templateDir, 'README-template.md'))) {
      const readmeTemplate = await fs.readFile(
        path.join(templateDir, 'README-template.md'),
        'utf-8'
      );
      const readme = processTemplate(readmeTemplate, replacements);
      
      await fs.writeFile(
        path.join(agentDir, 'README.md'),
        readme
      );
    }
    
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
   ├── README.md         # Documentation
   ├── logs/             # Reasoning logs
   └── tasks/            # Task definitions
       └── sample-task.md`));
    
    console.log(chalk.white('\n🚀 Next steps:'));
    console.log(chalk.cyan(`   thinking run "Your first task"`));
    console.log(chalk.cyan(`   thinking browse @${org.handle}/${agentName}`));
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${error.message}`));
    console.error(chalk.gray(error.stack));
    process.exit(1);
  }
};