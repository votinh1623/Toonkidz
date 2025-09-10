module.exports = {
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16
  },
  ssl: {
    keyPath: './ssl/localhost.key',
    certPath: './ssl/localhost.crt'
  }
};