// Database configuration for future implementation
const config = {
  development: {
    dialect: 'sqlite',
    storage: './database/nutriconnect.db',
    logging: console.log
  },
  production: {
    dialect: 'postgresql',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    logging: false,
    ssl: true
  }
};

module.exports = config;
