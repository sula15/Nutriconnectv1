// DPI integration configuration
const dpiConfig = {
  sludi: {
    baseUrl: process.env.SLUDI_BASE_URL || 'https://sandbox-sludi.gov.lk',
    clientId: process.env.SLUDI_CLIENT_ID,
    clientSecret: process.env.SLUDI_CLIENT_SECRET,
    scopes: ['profile', 'education', 'subsidy']
  },
  ndx: {
    baseUrl: process.env.NDX_BASE_URL || 'https://sandbox-ndx.gov.lk',
    apiKey: process.env.NDX_API_KEY,
    endpoints: {
      meals: '/api/v1/school-meals',
      subsidies: '/api/v1/subsidies',
      schools: '/api/v1/schools'
    }
  },
  paydpi: {
    baseUrl: process.env.PAYDPI_BASE_URL || 'https://sandbox-paydpi.gov.lk',
    merchantId: process.env.PAYDPI_MERCHANT_ID,
    apiKey: process.env.PAYDPI_API_KEY,
    webhookSecret: process.env.PAYDPI_WEBHOOK_SECRET
  }
};

module.exports = dpiConfig;