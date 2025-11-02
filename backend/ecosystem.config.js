// Configuration PM2 pour maintenir le backend en ligne de manière permanente
module.exports = {
  apps: [
    {
      name: 'cgcs-backend',
      script: 'pnpm',
      args: 'start:dev',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      // Redémarrer automatiquement en cas d'erreur
      restart_delay: 3000,
      // Redémarrer après un certain nombre de redémarrages rapides
      max_restarts: 10,
      min_uptime: '10s',
      // Ignorer les erreurs de syntaxe et continuer
      ignore_watch: ['node_modules', 'logs', '.git'],
    },
  ],
};


