export const envValue = (productionValue, stagingValue, devValue, defaultValue) => {
  const ENV = process.env.NODE_ENV
  const HS_ENV = typeof window.hs === 'object' && window.hs.env

  switch (true) {
    case HS_ENV === 'production':
      return productionValue
    case HS_ENV === 'staging':
      return stagingValue
    case HS_ENV === 'dev':
      return devValue
    case ENV === 'production':
      return productionValue
    case ENV === 'staging':
      return stagingValue
    case ENV === 'development':
      return devValue
    case typeof defaultValue !== 'undefined':
      return defaultValue
    default:
      throw new Error(`[hs-app-composer] Unknown NODE_ENV:${ENV}`)
  }
}
