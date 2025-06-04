module.exports = {
  apps: [
    {
      name: 'wallet-finance-api',
      script: 'dist/main.js',
      instances: '2',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      log_file: '/dev/stdout',
      out_file: '/dev/stdout',
      error_file: '/dev/stderr',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      node_args: '--max-old-space-size=1024',

      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,

      instance_var: 'INSTANCE_ID',

      pmx: true,

      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 3000,

      health_check_grace_period: 3000,
    },
  ],
};
