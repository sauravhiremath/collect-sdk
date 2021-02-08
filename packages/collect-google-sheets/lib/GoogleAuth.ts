import { google } from 'googleapis';
import {
  OAuth2ClientOptions,
  Credentials,
  OAuth2Client,
} from 'google-auth-library';
import fs from 'fs';
import url from 'url';
import http from 'http';
import open from 'open';
import enableDestroy from 'server-destroy';

import { GoogleSheets } from './GoogleSheets';
import { HttpError } from '@collect/core';

export interface GoogleConfig {
  credentialsPath: string;
  tokenPath: string;
  scopes: string[];
  /** One of the following environments: collect, collect-dev, local, and other string. */
  env?: string;
  /** The URL of your custom environment. */
  customUrl?: string;
}
/**
 * Authenticate Google APIs SDK using Google Auth Credentials.
 */
export class Google {
  public sheets?: GoogleSheets;
  private readonly m_credentials: OAuth2ClientOptions;
  private readonly m_token: Credentials;
  private readonly m_scopes: Array<string>;

  private readonly m_apiUrl?: string;

  /**
   * Creates the [[Google]] instance.
   *
   * @param config Parameters for authentication with google apis. Refer https://developers.google.com/sheets/api/quickstart/nodejs
   * @return The [[Google]] instance.
   */
  constructor(private readonly config: GoogleConfig) {
    if (this.config.customUrl !== undefined) {
      this.m_apiUrl = this.config.customUrl;
    }

    if (this.config.customUrl) {
      switch (this.config.env) {
        case 'collect':
          this.m_apiUrl = 'https://account.api.collect.atlan.com/';
          break;
        case 'collect-dev':
          this.m_apiUrl = 'https://account.api.dev.collect.atlan.com/';
          break;
        default:
          this.m_apiUrl = 'https://account.api.collect.atlan.com/';
          break;
      }
    }

    if (!config.tokenPath || !config.credentialsPath) {
      throw new Error(
        'The credentials and/or token has not been added, please add required file paths!'
      );
    }

    this.m_credentials = JSON.parse(
      fs.readFileSync(config.credentialsPath, 'utf8')
    );
    this.m_token = JSON.parse(fs.readFileSync(config.tokenPath, 'utf8'));
    this.m_scopes = config.scopes || [
      'https://www.googleapis.com/auth/spreadsheets',
    ];
  }

  async initialiseSheets(): Promise<GoogleSheets> {
    const auth = await this.authorize();
    this.sheets = new GoogleSheets(auth);
    return this.sheets;
  }

  /**
   * Create a new OAuth2Client, and go through the OAuth2 content
   * workflow.
   *
   * @returns The full [[OAuth2Client]] to the callback.
   */
  private async getToken(oAuth2Client: OAuth2Client): Promise<OAuth2Client> {
    return new Promise((resolve, reject) => {
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: this.m_scopes,
      });

      // Open an http server to accept the oauth callback. Here, the
      // only request to our webserver is to /oauth2callback?code=<code>
      const server = http
        .createServer(async (req, res) => {
          try {
            if (req.url && req.url.indexOf('/oauth2callback') > -1) {
              // Acquire the code from the querystring, and close the web server.
              const qs = new url.URL(req.url, 'http://localhost:3000')
                .searchParams;
              const code = qs.get('code');
              res.end(
                'Authentication successful! Please return to the console.'
              );
              server.destroy();

              if (!code) {
                throw new HttpError(
                  500,
                  'OAuth2 Token re-creation failed. Internal Error!'
                );
              }

              const r = await oAuth2Client.getToken(code);
              oAuth2Client.setCredentials(r.tokens);
              resolve(oAuth2Client);
            }
          } catch (e) {
            reject(e);
          }
        })
        .listen(3000, () => {
          // Open the browser to the authorize url to start the workflow
          open(authUrl, { wait: false }).then((cp) => cp.unref());
        });
      enableDestroy(server);
    });
  }

  private async authorize(): Promise<OAuth2Client> {
    const { clientSecret, clientId, redirectUri } = this.m_credentials;
    const oAuth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    if (this.m_token) {
      oAuth2Client.setCredentials(this.m_token);
      return oAuth2Client;
    }

    return this.getToken(oAuth2Client);
  }
}
