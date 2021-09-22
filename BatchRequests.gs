// Based on https://github.com/tanaikech/BatchRequest

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

    if (this.reqs.length > 100) {
      return this.enhancedDo();
    } else {
      return UrlFetchApp.fetch(this.url, this.createRequest(this.reqs));
    }
  }

  enhancedDo() {
    const limit = 100;
    const split = Math.ceil(this.reqs.length / limit);

    if (typeof UrlFetchApp.fetchAll === 'function') {
      const reqs = [];
      var i = 0;
      var j = 0;

      for (; 0 <= split ? j < split : j > split; i = 0 <= split ? ++j : --j) {
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

    var allResponses = [];
    var i = 0;
    var k = 0;
    for (; 0 <= split ? k < split : k > split; i = 0 <= split ? ++k : --k) {
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

  parser(contentText) {
    const regex = /{[\S\s]+}/g;
    var temp = contentText.split('--batch');

    return temp.slice(1, temp.length - 1).map((e) => {
      if (regex.test(e)) {
        return JSON.parse(e.match(regex)[0]);
      }
      return e;
    });
  }

  createRequest(requests) {
    const boundary = 'xxxxxxxxxx';

    var contentId = 0;
    var data = `--${boundary}\r\n`;
    requests.forEach(() => (req) => {
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

      return data;
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
