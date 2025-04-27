module.exports = {
  apps: [
    {
      name: 'shopemx',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
