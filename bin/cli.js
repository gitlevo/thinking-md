#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const pkg = require('../package.json');

// Commands
const init = require('../lib/commands/init');
const run = require('../lib/commands/run');
const publish = require('../lib/commands/publish');

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

program
  .command('init <agent-name>')
  .description('Initialize a new agent')
  .option('-d, --description <desc>', 'Agent description')
  .option('-c, --capabilities <caps...>', 'Agent capabilities')
  .action(init);

program
  .command('run <task-file>')
  .description('Run a task and log reasoning')
  .option('-a, --agent <name>', 'Agent name', 'default-agent')
  .action(run);

program
  .command('publish <log-file>')
  .description('Publish reasoning log to thinking.md')
  .option('-p, --public', 'Make publicly accessible')
  .action(publish);

program
  .command('a2a-serve')
  .description('Start A2A-compliant server for this agent')
  .option('-p, --port <port>', 'Port to listen on', '3000')
  .action(require('../lib/commands/a2a-serve'));

program.parse();

// Show help if no command
if (!process.argv.slice(2).length) {
  program.outputHelp();
}