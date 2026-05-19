module.exports = {
  apps: [
    {
      name: 'socialai-manager',
      script: './server/index.js',
      cwd: '/var/www/socialai',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: '/var/log/socialai/err.log',
      out_file: '/var/log/socialai/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
