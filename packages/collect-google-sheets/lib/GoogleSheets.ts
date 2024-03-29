import { google, sheets_v4 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { StoreData } from '@collect/store';

export class GoogleSheets {
  public sheetsService: sheets_v4.Sheets;
  private readonly auth: OAuth2Client;

  /**
   * Creates the [[GoogleSheets]] instance.
   *
   * @param config Parameters for authentication with google apis. Refer https://developers.google.com/sheets/api/quickstart/nodejs
   * @return The [[GoogleSheets]] instance.
   */
  constructor(private readonly oAuth2Client: OAuth2Client) {
    this.auth = oAuth2Client;
    this.sheetsService = google.sheets({ version: 'v4', auth: this.auth });
  }

  /**
   * Export Array of objects to a new google spreadsheet
   *
   * @param data Array of objects from Form Store Data
   * @param title User defined title of the spreadsheet to be created
   * @returns updated spreadsheet data after all operations
   */
  async export2Sheets(
    data: StoreData[],
    title: string
  ): Promise<sheets_v4.Schema$BatchUpdateSpreadsheetResponse> {
    try {
      const resource: sheets_v4.Params$Resource$Spreadsheets$Create = {
        auth: this.auth,
        requestBody: { properties: { title } }
      };

      let spreadsheetId: string | undefined;
      let spreadsheetUrl: string | undefined;

      const spreadsheet = await this.sheetsService.spreadsheets.create(
        resource
      );
      if (spreadsheet.status === 200) {
        spreadsheetId = spreadsheet.data.spreadsheetId;
        spreadsheetUrl = spreadsheet.data.spreadsheetUrl;
      } else {
        throw new Error('Spreadsheet creation failed. Kindly try again!');
      }

      const requests: sheets_v4.Schema$Request[] = [];

      data.forEach(storeData => {
        requests.push({
          appendCells: { rows: [...Object.values(storeData)] }
        });
      });

      const updateParameters: sheets_v4.Params$Resource$Spreadsheets$Batchupdate = {
        auth: this.auth,
        requestBody: { includeSpreadsheetInResponse: true, requests },
        spreadsheetId
      };

      const updatedSheet = await this.sheetsService.spreadsheets.batchUpdate(
        updateParameters
      );

      if (updatedSheet.status === 200) {
        return updatedSheet.data;
      }

      throw new Error(
        'Google Sheets batch update failed. Internal Server Error!'
      );
    } catch (error: unknown) {
      throw error;
    }
  }
}
