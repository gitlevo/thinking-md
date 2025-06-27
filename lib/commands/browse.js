const chalk = require('chalk');
const Conf = require('conf');

const config = new Conf({ projectName: 'thinking-md' });

module.exports = async function browse(target) {
  try {
    const org = config.get('organization');
    let url = 'https://thinking.md';
    
    if (target) {
      // Direct target specified
      if (target.startsWith('@')) {
        url = `https://thinking.md/${target}`;
      } else if (org) {
        url = `https://thinking.md/@${org.handle}/${target}`;
      } else {
        url = `https://thinking.md/${target}`;
      }
    } else if (org) {
      // Browse current org
      url = `https://thinking.md/@${org.handle}`;
    }
    
    console.log(chalk.blue('\n🌐 Visit your page at:'));
    console.log(chalk.cyan(`   ${url}\n`));
    
    // Try to open with dynamic import
    try {
      const open = await import('open');
      await open.default(url);
      console.log(chalk.gray('(Opening in your browser...)\n'));
    } catch (e) {
      console.log(chalk.gray('(Copy and paste this URL into your browser)\n'));
    }
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${error.message}`));
  }
};