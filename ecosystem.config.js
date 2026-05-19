module.exports = {
  apps: [
    {
      name: 'socialai-manager',
      script: 'index.js',
      cwd: '/home/admin-01/Social-manager/server',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: '/home/admin-01/Social-manager/logs/err.log',
      out_file: '/home/admin-01/Social-manager/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
