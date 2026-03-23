module.exports = {
  apps: [{
    name: 'office-console',
    script: 'src/server.ts',
    interpreter: 'node',
    interpreter_args: '--import tsx',
    env: {
      NODE_ENV: 'production',
      PORT: '3014',
      READONLY_MODE: 'true'
    },
    max_restarts: 5,
    restart_delay: 3000,
    watch: false,
    error_file: 'logs/pm2-error.log',
    out_file: 'logs/pm2-out.log'
  }]
};
