import {EnvironmentName} from '../utils';

export interface ClientSettingsParameters {
  /**
   * An asynchronous callback used to return a `Promise` with the access token for requests.
   *
   * @example
   * ```typescript
   *  import { UserAuth } from "@collect/auth";
   *
   *  const userAuth = new UserAuth(/** parameters **);
   *  const getToken = userAuth.getToken();
   * ```
   *
   * @return The `Promise` with the access token for requests.
   */
  getToken: () => Promise<string>;

  /**
   * An environment that should be used to get the URL of the API Lookup Service.
   * You can also specify a URL of your custom service.
   *
   * @example
   *
   * ```
   *  'collect' | 'collect-dev' | 'http://127.0.0.1/local-api-service'
   * ```
   */
  environment: EnvironmentName;
}
