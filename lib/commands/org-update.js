const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const Conf = require('conf');

const config = new Conf({ projectName: 'thinking-md' });

async function updateOrgIndex() {
  try {
    const org = config.get('organization');
    if (!org) return;
    
    const orgDir = path.join(process.cwd(), '.thinking');
    const agentsDir = path.join(orgDir, 'agents');
    
    // Collect all agents
    let agents = [];
    if (await fs.pathExists(agentsDir)) {
      const agentDirs = await fs.readdir(agentsDir);
      for (const agent of agentDirs) {
        const cardPath = path.join(agentsDir, agent, 'agent-card.json');
        if (await fs.pathExists(cardPath)) {
          const card = await fs.readJson(cardPath);
          const logsDir = path.join(agentsDir, agent, 'logs');
          let recentActivity = 'No activity yet';
          
          if (await fs.pathExists(logsDir)) {
            const logs = await fs.readdir(logsDir);
            const mdLogs = logs.filter(f => f.endsWith('.md')).sort().reverse();
            if (mdLogs.length > 0) {
              const latest = mdLogs[0];
              const logContent = await fs.readFile(path.join(logsDir, latest), 'utf-8');
              const taskMatch = logContent.match(/^# (.+)$/m);
              const dateMatch = logContent.match(/\*\*Date\*\*: (.+)/);
              if (taskMatch && dateMatch) {
                const date = new Date(dateMatch[1]).toLocaleDateString();
                recentActivity = `${date}: ${taskMatch[1]}`;
              }
            }
          }
          
          agents.push({
            name: agent,
            description: card.description,
            capabilities: card.capabilities,
            recentActivity
          });
        }
      }
    }
    
    // Generate organization llms.txt
    const orgLlmsTxt = `# @${org.handle}

${org.displayName}'s AI agents for ${org.type === 'company' ? 'business' : org.type} automation.

## Our Agents

${agents.length > 0 ? agents.map(agent => `### ${agent.name}
${agent.description}
https://thinking.md/@${org.handle}/${agent.name}/
Capabilities: ${agent.capabilities.join(', ')}`).join('\n\n') : 'No agents created yet. Use \'thinking agent create <name>\' to create one.'}

## Recent Activity
${agents.length > 0 ? agents.map(agent => `- ${agent.recentActivity}`).join('\n') : '- No activity yet'}

## How to cite our agents
Reference: @${org.handle}/{agent-name} at thinking.md

## Organization Info
- Type: ${org.type}
- Created: ${new Date(org.created).toLocaleDateString()}
- Total Agents: ${agents.length}
- Profile: https://thinking.md/@${org.handle}
`;
    
    await fs.writeFile(
      path.join(orgDir, 'llms.txt'),
      orgLlmsTxt
    );
    
  } catch (error) {
    // Silently fail - this is a background update
  }
}

module.exports = updateOrgIndex;