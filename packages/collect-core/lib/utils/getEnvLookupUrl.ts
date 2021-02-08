/**
 * The name of the environment that you use for this instance.
 * You can also pass the URL string of your local or custom environment.
 */
export type EnvironmentName = 'collect' | 'collect-dev' | 'local' | string;

/**
 * Gets the URL string of the API Lookup Service.
 *
 * @param env The environment that you use for this instance. You can also pass the URL string of your local or custom environment.
 * @return Based on the specified environment, the URL string of the API Lookup Service or the URL string of the custom service.
 */
export function getEnvLookUpUrl(env: EnvironmentName): string {
  function isURL(string: string) {
    const protocol = '(?:(?:[a-z]+:)?//)';
    const ip = '(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}';
    const host =
      '(?:(?:[a-z\\u00a1-\\uffff0-9][-_]*)*[a-z\\u00a1-\\uffff0-9]+)';
    const domain =
      '(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*';
    const tld = '(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))\\.?';
    const port = '(?::\\d{2,5})?';
    const path = '(?:[/?#][^\\s"]*)?';
    const regex = new RegExp(
      `(?:${protocol}|www\\.)(?:localhost|${ip}|${host}${domain}${tld})${port}${path}`
    );

    return regex.test(string.trim());
  }

  if (isURL(env)) {
    return env;
  }

  switch (env) {
    case 'collect-dev':
      return 'https://api-lookup.dev.api.collect.atlan.com/lookup/v1';
    case 'local':
      return 'http://localhost:31005/lookup/v1';
    default:
      return 'https://api-lookup.api.collect.atlan.com/lookup/v1';
  }
}
