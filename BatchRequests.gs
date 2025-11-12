// Based on https://github.com/tanaikech/BatchRequest
// Handles batch requests to Google Calendar API for efficient bulk operations.
// Google Calendar API allows up to 100 requests per batch.

/**
 * BatchRequest class for handling multiple Google Calendar API requests efficiently.
 * Automatically splits large request arrays into batches of 100 (API limit).
 * 
 * @class
 * @param {Object} obj - Configuration object
 * @param {Array} obj.requests - Array of request objects with method, endpoint, and optional requestBody
 * @param {string} [obj.batchPath] - Optional batch API path (default: uses requests[0] API version)
 * @param {string} [obj.accessToken] - Optional OAuth token (default: uses ScriptApp.getOAuthToken())
 * @param {boolean} [obj.useFetchAll] - Force use of UrlFetchApp.fetchAll for parallel requests
 * @returns {Array} Array of response objects from the batch requests
 * 
 * @example
 * const result = new BatchRequest({
 *   batchPath: "batch/calendar/v3",
 *   requests: [
 *     { method: "POST", endpoint: "...", requestBody: {...} },
 *     { method: "DELETE", endpoint: "..." }
 *   ]
 * });
 */
class BatchRequest {
  constructor(obj) {
    if (!obj.hasOwnProperty('requests')) {
      throw new Error("'requests' property was not found in object.");
    }

    this.reqs = obj.requests.slice();
    this.url = 'https://www.googleapis.com/batch';

    if (obj.batchPath) {
      const batchPath = obj.batchPath.trim();

      if (~batchPath.indexOf('batch/')) {
        this.url += batchPath.replace('batch', '');
      } else {
        this.url += batchPath.slice(0, 1) === '/' ? batchPath : `/${batchPath}`;
      }
    }

    this.accessToken = obj.accessToken || ScriptApp.getOAuthToken();

    if (obj.useFetchAll === true || this.reqs.length > 1) {
      return this.enhancedDo();
    } else {
      let res = UrlFetchApp.fetch(this.url, this.createRequest(this.reqs));

      res = this.parser(res.getContentText());
      return res;
    }
  }

  /**
   * Enhanced batch request handler that splits requests into chunks of 100.
   * Uses UrlFetchApp.fetchAll when available for parallel processing.
   * 
   * @returns {Array} Combined array of all batch response objects
   */
  enhancedDo() {
    // Google Calendar API batch limit is 100 requests per batch
    const limit = 100;
    const split = Math.ceil(this.reqs.length / limit);

    // Use fetchAll for parallel batch processing if available
    if (typeof UrlFetchApp.fetchAll === 'function') {
      const reqs = [];

      for (let i = 0; i < split; i++) {
        const params = this.createRequest(this.reqs.splice(0, limit));
        params.url = this.url;
        reqs.push(params);
      }

      const res = UrlFetchApp.fetchAll(reqs).reduce((array, item) => {
        if (item.getResponseCode() !== 200) {
          array.push(item.getContentText());
        } else {
          array = array.concat(this.parser(item.getContentText()));
        }
        return array;
      }, []);

      return res;
    }

    // Fallback: Process batches sequentially
    const allResponses = [];
    
    for (let i = 0; i < split; i++) {
      const params = this.createRequest(this.reqs.splice(0, limit));

      const response = UrlFetchApp.fetch(this.url, params);

      if (response.getResponseCode() !== 200) {
        allResponses.push(response.getContentText());
      } else {
        allResponses = allResponses.concat(
          this.parser(response.getContentText())
        );
      }
    }

    return allResponses;
  }

  /**
   * Parses batch response content into individual response objects.
   * Batch responses are separated by boundary markers.
   * 
   * @param {string} contentText - Raw batch response text
   * @returns {Array} Array of parsed response objects
   */
  parser(contentText) {
    const regex = /{[\S\s]+}/g;
    const temp = contentText.split('--batch');

    return temp.slice(1, temp.length - 1).map((e) => {
      if (regex.test(e)) {
        return JSON.parse(e.match(regex)[0]);
      }
      return e;
    });
  }

  /**
   * Creates a properly formatted batch request payload.
   * Follows the multipart/mixed content format required by Google APIs.
   * 
   * @param {Array} requests - Array of request objects to batch
   * @returns {Object} UrlFetchApp request options object
   */
  createRequest(requests) {
    const boundary = 'xxxxxxxxxx';

    let contentId = 0;
    let data = `--${boundary}\r\n`;
    
    requests.forEach((req) => {
      data +=
        `Content-Type: application/http\r\n` +
        `Content-ID: ${++contentId}\r\n\r\n` +
        `${req.method} ${req.endpoint}\r\n`;

      if (req.accessToken) {
        data += `Authorization: Bearer ${req.accessToken}\r\n`;
      }

      if (req.requestBody) {
        data +=
          `Content-Type: application/json; charset=utf-8\r\n\r\n` +
          `${JSON.stringify(req.requestBody)}\r\n`;
      } else {
        data += '\r\n';
      }

      data += `--${boundary}\r\n`;
    });

    return {
      muteHttpExceptions: true,
      method: 'post',
      contentType: `multipart/mixed; boundary=${boundary}`,
      payload: Utilities.newBlob(data).getBytes(),
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    };
  }
}
