import { HttpError } from '@collect/core';
import { v4 } from 'uuid';

/**
 * Signing a request using HMAC algorithms.
 */
export interface Signer {
  /**
   * Signs data using your secret key and returns a `Promise` that fulfills `ArrayBuffer` containing the signature.
   *
   * @param data The `ArrayBufferLike` object containing the data to be signed.
   * @param secretKey Your secret key that is used for signing.
   * @return The encrypted ID for an access token.
   */
  sign: (data: ArrayBufferLike, secretKey: string) => Promise<string>;
  /**
   * Fills the passed `TypedArray` with cryptographically strong random values (random in its cryptographic meaning).
   *
   * @param data The integer-based `TypedArray`.
   * @return The input array.
   * @note The `TypedArray` is modified in-place, and no copy is made.
   */
  getRandomValues: (data: Uint8Array) => Uint8Array;
}

/**
 * Contains arguments needed to get an access token.
 */
export interface OAuthArgs {
  /** The environment in which you work. */
  url: string;
  /** Your consumer key. */
  consumerKey: string;
  /** Your secret key. */
  secretKey: string;
  /** A unique token that your application generates for each unique request. If not provided, the default token is used. */
  nonce?: string;
  /** The time when you authenticated. */
  timestamp?: number;
  /** The expiration time (in milliseconds). */
  expiresIn?: number;
  /** The project scope. */
  scope?: string;
}

/**
 * Interface for an access token.
 */
export interface Token {
  /** The token for access. */
  accessToken: string;
  /** The type of token. */
  tokenType: string;
  /** The expiration time (in milliseconds). */
  expiresIn: number;
}

const UID_SIZE = 16;
const MINS_PER_HOUR = 60;
const SECS_PER_MIN = 60;
const MILLISECS_PER_SEC = 1000;

async function signLatin1(
  data: string,
  secretKey: string,
  tokenSigner: Signer
): Promise<string> {
  const buf = new Uint8Array(data.length);
  for (let i = 0; i < data.length; ++i) {
    buf[i] = data.charCodeAt(i);
  }

  return tokenSigner.sign(buf.buffer, secretKey);
}

function generateUid(): string {
  return v4();
}

async function getOAuthAuthorization(
  args: OAuthArgs,
  tokenSigner: Signer
): Promise<string> {
  if (args.timestamp === undefined) {
    args.timestamp = Math.floor(Date.now() / MILLISECS_PER_SEC);
  }

  if (args.nonce === undefined) {
    args.nonce = generateUid();
  }

  const signatureBase =
    'POST&' +
    encodeURIComponent(args.url) +
    '&' +
    encodeURIComponent(
      `oauth_consumer_key=${args.consumerKey}&oauth_nonce=${args.nonce}&oauth_signature_method=HMAC-SHA256&oauth_timestamp=${args.timestamp}&oauth_version=1.0`
    );

  const signature = await signLatin1(
    signatureBase,
    args.secretKey + '&',
    tokenSigner
  );

  return `OAuth oauth_consumer_key="${encodeURIComponent(
    args.consumerKey
  )}",oauth_nonce="${encodeURIComponent(
    args.nonce
  )}",oauth_signature_method="HMAC-SHA256",oauth_timestamp="${
    args.timestamp
  }",oauth_version="1.0",oauth_signature="${encodeURIComponent(signature)}"`;
}

/**
 * Creates an access token.
 *
 * @param args The arguments needed to get the access token.
 * @param tokenSigner The encrypted ID for the access token.
 * @return The access token.
 */
export async function requestToken(
  args: OAuthArgs,
  tokenSigner: Signer
): Promise<Token> {
  const authorization = await getOAuthAuthorization(args, tokenSigner);

  const body = {
    grantType: 'client_credentials',
    scope: args.scope,
    expiresIn:
      args.expiresIn === undefined ?
        SECS_PER_MIN * MINS_PER_HOUR :
        args.expiresIn
  };

  const headers = new Headers({
    Authorization: authorization,
    'Content-Type': 'application/json'
  });

  const requestInit: any = {
    method: 'POST',
    body: JSON.stringify(body) as BodyInit,
    headers
  };

  const request = await fetch(args.url, requestInit);

  if (!request.ok) {
    return Promise.reject(new HttpError(request.status, request.statusText));
  }

  return request.json();
}
