module.exports = {
  NFR01: {
    name: 'Response Time',
    target: 30000,  // 30 seconds for local GPU
    implementation: 'Queued processing with progress tracking'
  },
  NFR02: {
    name: 'Concurrent Users',
    target: 200,
    implementation: 'Connection pooling and load shedding'
  },
  NFR03: {
    name: 'Encryption',
    target: 'SSL/TLS for all communications',
    implementation: 'HTTPS with local certificates'
  },
  NFR04: {
    name: 'Uptime',
    target: 0.95,
    implementation: 'Health checks and auto-restart'
  },
  NFR05: {
    name: 'Usability',
    target: 'Ages 3-10',
    implementation: 'Simplified UI and lock mode'
  },
  NFR06: {
    name: 'Platform Support',
    target: 'Web responsive',
    implementation: 'Mobile-friendly design'
  },
  NFR07: {
    name: 'Multi-language',
    target: 'EN, VI',
    implementation: 'Basic i18n support'
  }
};