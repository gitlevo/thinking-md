// A2A Authentication - Following Linux Foundation standard
module.exports = {
    validateA2ARequest: (req, res, next) => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: "Authentication required",
          protocol: "a2a/1.0",
          authenticate: "Bearer"
        });
      }
      
      // Validate token (implement your auth logic)
      const token = authHeader.split(' ')[1];
      
      // For now, simple validation
      if (token && token.length > 10) {
        next();
      } else {
        res.status(403).json({
          error: "Invalid authentication",
          protocol: "a2a/1.0"
        });
      }
    }
  };