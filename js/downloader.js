export class Downloader {
  async download(url, progressCallback) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}`);
    }
    const contentLength = parseInt(response.headers.get('Content-Length')) || 0;
    const reader = response.body.getReader();
    let received = 0;
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      if (progressCallback && contentLength) {
        progressCallback(received / contentLength);
      }
    }
    return new Blob(chunks);
  }

  async preloadAssets(assets, progressCallback) {
    const results = {};
    for (const asset of assets) {
      const blob = await this.download(asset.url, p => {
        if (progressCallback) progressCallback(asset, p);
      });
      results[asset.name] = blob;
    }
    return results;
  }
}
