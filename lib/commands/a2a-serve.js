const chalk = require('chalk');

module.exports = async function serve(options) {
  console.log(chalk.blue(`\n🌐 Starting A2A server on port ${options.port}\n`));
  console.log(chalk.yellow('⚠️  A2A server coming soon in next version'));
  console.log(chalk.gray('\nFor now, use the publish command to make logs public.'));
};