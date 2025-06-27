// A2A Discovery Endpoint - Following Linux Foundation standard
module.exports = {
    // GET /api/v1/agents/{agent-name}
    getAgentInfo: async (req, res) => {
      const agent = {
        id: req.params.agentName,
        name: req.params.agentName,
        version: "1.0.0",
        protocol: "a2a/1.0",
        capabilities: [
          {
            id: "reason",
            name: "Reasoning",
            description: "Provide transparent reasoning traces",
            method: "POST",
            endpoint: `/api/v1/agents/${req.params.agentName}/execute/reason`
          },
          {
            id: "query",
            name: "Query Logs",
            description: "Search through agent reasoning logs",
            method: "GET",
            endpoint: `/api/v1/agents/${req.params.agentName}/logs`
          }
        ],
        metadata: {
          thinking_md_profile: `https://thinking.md/${req.params.agentName}`,
          llms_txt: `https://thinking.md/${req.params.agentName}/llms.txt`
        }
      };
      
      res.json(agent);
    }
  };