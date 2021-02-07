/**
 * Status codes of HTTP responses.
 */
export enum STATUS_CODES {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  NOT_FOUND = 404,
  TO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAIBLE = 503,
  NETWORK_CONNECT_TIMEOUT = 599,
}

export * from "./getEnvLookupUrl";
