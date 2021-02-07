import { HttpError } from "@collect/core";
import { OAuthArgs, Token } from "./requestToken";

/** User credentials. */
export interface AuthCredentials {
  accessKeyId?: string;
  accessKeySecret?: string;
}

/**
 * Gets an access token.
 *
 * @param args The arguments needed to get the access token.
 * @return The generated access token.
 */
export type TokenRequesterFn = (args: OAuthArgs) => Promise<Token>;

/**
 * Parameters for authentification.
 */
export interface UserAuthConfig {
  /** Credentials for authorization. */
  credentials?: AuthCredentials;
  /** One of the following environments: collect, collect-dev, local, and other string. */
  env?: string;
  /** The URL of your custom environment. */
  customUrl?: string;
  /**
   * Gets the access token.
   *
   * You can provide your own implementation or use one from `@collect/auth`.
   *
   * There are two functions that work for the browser and Node.js.
   * For the browser, `UserAuth` uses `requestToken()` from requestToken.web.ts.
   * For Node.js,`UserAuth` uses `requestToken()` from requestToken.ts.
   *
   * When a function imports a function using `import { requestToken }` from "@collect/auth"`,
   * the code automatically applies to the corresponding function.
   *
   * The following code is applicable only for Node.js.
   *
   * @example
   *
   * ```typescript
   * import { UserAuth, requestToken } from "@collect/auth";
   *
   * const userAuth = new UserAuth({
   *     credentials: {
   *         accessKeyId: "your-access-key",
   *         accessKeySecret: "your-access-key-secret"
   *     },
   *     tokenRequester: requestToken
   * });
   * ```
   */
  tokenRequester: TokenRequesterFn;
  /**
   * Project scope.
   *
   * If the project is specified, the resulting token is bound to it.
   * If the desired resource is restricted to a specific project, to get a valid token, specify this project.
   */
  scope?: string;
  /**
   * The maximum validity of the token in seconds.
   *
   * It must be equal or greater than zero.
   * This value will be ignored if it is zero or greater than the maximum expiration
   * defined by the application which is usually 24h.
   */
  expiresIn?: number;
}

/**
 * User data and information.
 */
export interface UserInfo {
  /** * Your unique identifier. */
  userId: string;
  /** The scope to which you belong. */
  scope: string;
  /** Your first name. */
  firstname: string;
  /** Your last name. */
  lastname: string;
  /** Your email address. */
  email: string;
  /** True if your email is verified; false otherwise. */
  emailVerified: boolean;
  /** The Unix time (seconds) when the authorization was created. */
  createdTime: number;
  /** The Unix time (seconds) when the authorization was updated. */
  updatedTime: number;
  /** Your user status. */
  state: string;
}

/**
 * Used to get and validate an access token, and to get user data.
 */
export class UserAuth {
  private m_accessToken: string | undefined;
  private m_expirationDate?: Date;
  private m_expiresIn?: number;
  private m_credentials: AuthCredentials = {};
  private m_scope?: string;
  private readonly m_apiUrl: string;

  /**
   * Creates the [[UserAuth]] instance.
   *
   * @param config Parameters for authentication.
   * @return The [[UserAuth]] instance.
   */
  constructor(private readonly config: UserAuthConfig) {
    if (this.config.customUrl !== undefined) {
      this.m_apiUrl = this.config.customUrl;
    } else {
      switch (this.config.env) {
        case "collect":
          this.m_apiUrl = "https://account.api.collect.atlan.com/";
          break;
        case "collect-dev":
          this.m_apiUrl = "https://account.api.dev.collect.atlan.com/";
          break;
        default:
          this.m_apiUrl = "https://account.api.collect.atlan.com/";
          break;
      }
    }

    if (!config.credentials) {
      throw new Error(
        `The credentials has not been added, please add credentials!`
      );
    }

    this.m_scope = config.scope;
    this.m_credentials = config.credentials;
    this.m_expiresIn = config.expiresIn;
  }

  /**
   * Retrieves the access token.
   *
   * @return The access token if it is valid, or an error if at least one of the following credentials is not stated:
   * access key ID or access key secret.
   */
  async getToken(): Promise<string> {
    if (this.tokenIsValid()) {
      return this.m_accessToken!;
    }

    if (
      !this.m_credentials ||
      !this.m_credentials.accessKeyId ||
      !this.m_credentials.accessKeySecret
    ) {
      return Promise.reject(
        "Error getting token. The credentials has not been added!"
      );
    }

    const response = await this.config
      .tokenRequester({
        url: this.config.customUrl || this.m_apiUrl + "oauth2/token",
        consumerKey: this.m_credentials.accessKeyId,
        secretKey: this.m_credentials.accessKeySecret,
        scope: this.m_scope,
        expiresIn: this.m_expiresIn,
      })
      .catch((err) => Promise.reject(err));

    if (response.accessToken) {
      this.m_accessToken = response.accessToken;
    } else {
      return Promise.reject(response);
    }

    this.m_expirationDate = new Date();
    if (response.expiresIn !== undefined) {
      this.m_expirationDate.setSeconds(
        this.m_expirationDate.getSeconds() + response.expiresIn
      );
    }
    return this.m_accessToken;
  }

  /**
   * Validates the access token.
   *
   * @param token The string containing the token.
   * @return True if the access token is valid, false otherwise.
   */
  async validateAccessToken(token: string): Promise<string | boolean> {
    const body = {
      token,
    };

    const headers = new Headers({
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    });

    const request = await fetch(this.m_apiUrl + "verify/accessToken", {
      method: "POST",
      body: JSON.stringify(body),
      headers,
    });

    if (!request.ok) {
      return Promise.reject(new HttpError(request.status, request.statusText));
    }

    return Promise.resolve(true);
  }

  /**
   * Retrieves user data.
   *
   * @param userToken The string that contains the user token.
   * @return The `json` object with the user data.
   */
  async getUserInfo(userToken: string): Promise<UserInfo> {
    const headers = new Headers({
      Authorization: "Bearer " + userToken,
      "Content-Type": "application/json",
    });

    const request = await fetch(this.m_apiUrl + "user/me", {
      method: "GET",
      headers,
    });

    if (!request.ok) {
      return Promise.reject(
        new HttpError(
          request.status,
          `Error fetching user info: ${request.statusText}`
        )
      );
    }

    return request.json();
  }

  private tokenIsValid(): boolean {
    if (
      this.m_accessToken === undefined ||
      this.m_expirationDate === undefined
    ) {
      return false;
    }

    if (new Date() >= this.m_expirationDate) {
      return false;
    }

    return true;
  }
}
