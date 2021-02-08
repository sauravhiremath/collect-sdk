import { HttpError } from '@collect/core';

/**
 * ResponseType for given question
 */
export type ResponseType = string | number | string[] | boolean;

/**
 * Single User Response
 */
export interface UserResponse {
  /** User unique identifier. */
  responseId: string;
  /** Unique identifier of the user filling the response. */
  userId: string;
  /** Response Data. */
  responseData: ResponseType;
  /** The Unix time (seconds) when the form was created. */
  createdTime: number;
  /** The Unix time (seconds) when the form/formData was updated. */
  updatedTime: number;
}

/**
 * Form Data with questions and responses.
 */
export interface FormData {
  /** Question unique identifier. */
  questionId: string;
  /** Question description. */
  description: string;
  /** Collection of responses by all users. */
  responses: UserResponse[];
  /** The Unix time (seconds) when the form was created. */
  createdTime: number;
  /** The Unix time (seconds) when the form/formData was updated. */
  updatedTime: number;
}

/**
 * Form Store containing metadata and responses.
 */
export interface StoreData {
  /** * Form unique identifier. */
  formId: string;
  /** The scopes which can access the form. */
  authorizedScopes: string[];
  /** Form name. */
  formName: string;
  /** Form data collection. */
  formData: FormData[];
  /** The Unix time (seconds) when the form was created. */
  createdTime: number;
  /** The Unix time (seconds) when the form/formData was updated. */
  updatedTime: number;
}

export interface StoreConfig {
  /** The user access token with required permissions to access the given store. */
  accessToken: string;
  /** One of the following environments: collect, collect-dev, local, and other string. */
  env?: string;
  /** The URL of your custom environment. */
  customUrl?: string;
}

/**
 * Used to initialise form store and populate the data
 */
export class Store {
  private readonly m_accessToken: string;
  private readonly m_apiUrl: string;

  /**
   * Creates the [[Store]] instance.
   *
   * @param config Parameters for authentication.
   * @return The [[Store]] instance.
   */
  constructor(private readonly config: StoreConfig) {
    if (this.config.customUrl !== undefined) {
      this.m_apiUrl = this.config.customUrl;
    } else {
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

    if (!config.accessToken) {
      throw new Error(
        'The access token is not present, please get a user access token first!'
      );
    }

    this.m_accessToken = config.accessToken;
  }

  async getFormData(formId: string): Promise<StoreData> {
    if (!formId) {
      throw new Error('Cannot FETCH form data. Missing fields - formId!');
    }

    const headers = new Headers({
      Authorization: 'Bearer ' + this.m_accessToken,
      'Content-Type': 'application/json'
    });

    const request = await fetch(this.m_apiUrl + 'forms/' + formId, {
      method: 'GET',
      headers
    });

    if (!request.ok) {
      return Promise.reject(
        new HttpError(
          request.status,
          `Error fetching form info and/or insufficient permissions: ${request.statusText}`
        )
      );
    }

    return request.json();
  }

  /**
   *
   * @param formId The string containing unique identifier of the form to retrieve data from
   * @param userId The string containing unique identifier of the user to find in the form
   *
   * @returns Array<UserResponses> from the required form
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async findResponseByUserId(formId: string, userId: string): Promise<any> {}

  /**
   *
   * @param formId The string containing unique identifier of the form to remove data from
   * @param userId The string containing unique identifier of the user to find and remove from the form
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async removeResponseByUserId(formId: string, userId: string): Promise<void> {}
}
