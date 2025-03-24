import { IncomingMessage } from 'http';
import { contentTypes } from './types';

export async function readRequestBody(
  request: InstanceType<typeof IncomingMessage>,
): Promise<unknown> {
  let result = await readBody(request);

  let isJsonType = request.headers['content-type']
    ?.includes(contentTypes.json);
  if (isJsonType) {
    try {
      return JSON.parse(result);
    } catch (error) {
      console.error('Error parsing JSON:', error, result);
      throw new Error('Invalid JSON');
    }
  }

  return result;
}

async function readBody(request: InstanceType<typeof IncomingMessage>)
  : Promise<string> {
  return new Promise((resolve, reject) => {
    let bytes = [];

    request.on('data', (chunk: Uint8Array) => bytes.push(...chunk));

    request.on('end', () => {
      let asText = String.fromCharCode(...bytes);
      resolve(asText);
    });

    request.on('error', (error) => reject(error));
  });
}