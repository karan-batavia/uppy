/* eslint-disable max-classes-per-file */
/**
 * ProviderApiError is error returned when an adapter encounters
 * an http error while communication with its corresponding provider
 */
class ProviderApiError extends Error {
  /**
   * @param {string} message error message
   * @param {number} statusCode the http status code from the provider api
   */
  constructor (message, statusCode) {
    super(`HTTP ${statusCode}: ${message}`) // Include statusCode to make it easier to debug
    this.name = 'ProviderApiError'
    this.statusCode = statusCode
    this.isAuthError = false
  }
}

class ProviderUserError extends Error {
  /**
   * @param {object} json arbitrary JSON.stringify-able object that will be passed to the client
   */
  constructor (json) {
    super('User error')
    this.json = json
  }
}

/**
 * AuthError is error returned when an adapter encounters
 * an authorization error while communication with its corresponding provider
 */
class ProviderAuthError extends ProviderApiError {
  constructor () {
    super('invalid access token detected by Provider', 401)
    this.name = 'AuthError'
    this.isAuthError = true
  }
}

/**
 * Convert an error instance to an http response if possible
 *
 * @param {Error | ProviderApiError} err the error instance to convert to an http json response
 */
function errorToResponse (err) {
  if (err instanceof ProviderAuthError) {
    return { code: 401, json: { message: err.message } }
  }

  if (err instanceof ProviderApiError) {
    if (err.statusCode >= 500) {
      // bad gateway i.e the provider APIs gateway
      return { code: 502, json: { message: err.message } }
    }

    if (err.statusCode >= 400) {
      // 424 Failed Dependency
      return { code: 424, json: { message: err.message } }
    }
  }

  if (err instanceof ProviderUserError) {
    return { code: 400, json: err.json }
  }

  return undefined
}

function respondWithError (err, res) {
  const errResp = errorToResponse(err)
  if (errResp) {
    res.status(errResp.code).json(errResp.json)
    return true
  }
  return false
}

module.exports = { ProviderAuthError, ProviderApiError, ProviderUserError, respondWithError }
