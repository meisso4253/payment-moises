import { put, get, del } from '@vercel/blob';

export function receiptStorageReady() {
  return !!process.env.BLOB_READ_WRITE_TOKEN || !!(process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN);
}
export const receiptStorage = {
  async put(key: string, bytes: Uint8Array, options: { httpMetadata: { contentType: string } }) {
    await put(key, Buffer.from(bytes), {
      access: 'private', contentType: options.httpMetadata.contentType,
      addRandomSuffix: false, allowOverwrite: false,
    });
  },
  async get(key: string) {
    const result = await get(key, { access: 'private', useCache: false });
    return result?.statusCode === 200 ? { body: result.stream } : null;
  },
  async delete(key: string) { await del(key); },
};
