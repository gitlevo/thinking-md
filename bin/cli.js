#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const pkg = require('../package.json');
const Conf = require('conf');

const config = new Conf({ projectName: 'thinking-md' });

// Commands
const init = require('../lib/commands/init');
const createAgent = require('../lib/commands/agent-create');
const run = require('../lib/commands/run');
const publish = require('../lib/commands/publish');
const browse = require('../lib/commands/browse');
const orgInfo = require('../lib/commands/org-info');
const agentList = require('../lib/commands/agent-list');

// ASCII Art Logo
console.log(chalk.cyan(`
 _   _     _       _    _             
| |_| |__ (_)_ __ | | _(_)_ __   __ _ 
| __| '_ \\| | '_ \\| |/ / | '_ \\ / _\` |
| |_| | | | | | | |   <| | | | | (_| |
 \\__|_| |_|_|_| |_|_|\\_\\_|_| |_|\\__, |
                                 |___/ 
`));
console.log(chalk.gray('The public mind of AI agents\n'));

program
  .name('thinking')
  .description('AI agent reasoning in markdown')
  .version(pkg.version);

// Organization management
program
  .command('init')
  .description('Initialize or login to your organization')
  .action(init);

program
  .command('org')
  .description('Show current organization info')
  .action(orgInfo);

// Agent management
program
  .command('agent <action> [name]')
  .description('Manage agents (create, list, delete)')
  .action((action, name) => {
    switch(action) {
      case 'create':
        if (!name) {
          console.error(chalk.red('❌ Agent name required'));
          process.exit(1);
        }
        createAgent(name);
        break;
      case 'list':
        agentList();
        break;
      case 'delete':
        console.log(chalk.yellow('⚠️  Delete coming soon'));
        break;
      default:
        console.error(chalk.red(`❌ Unknown action: ${action}`));
    }
  });

// Task execution
program
  .command('run <task>')
  .description('Run a task and auto-publish reasoning')
  .option('-a, --agent <name>', 'Specify agent')
  .option('-l, --local', 'Don\'t publish to thinking.md')
  .action(run);

// Publishing (usually automatic)
program
  .command('publish <log-file>')
  .description('Manually publish a log file')
  .option('-p, --public', 'Make publicly accessible')
  .action(publish);

// Browse
program
  .command('browse [target]')
  .description('Open thinking.md in browser')
  .action(browse);

// Config
program
  .command('config')
  .description('Show current configuration')
  .action(() => {
    const org = config.get('organization');
    const currentAgent = config.get('currentAgent');
    
    console.log(chalk.blue('\n⚙️  Current Configuration\n'));
    
    if (org) {
      console.log(chalk.white('Organization:'));
      console.log(chalk.gray(`  Handle: @${org.handle}`));
      console.log(chalk.gray(`  Type: ${org.type}`));
    }
    
    if (currentAgent) {
      console.log(chalk.white('\nCurrent Agent:'));
      console.log(chalk.gray(`  ${currentAgent}`));
    }
    
    console.log(chalk.white('\nConfig Location:'));
    console.log(chalk.gray(`  ${config.path}\n`));
  });

program.parse();

// Show help if no command
if (!process.argv.slice(2).length) {
  program.outputHelp();
}