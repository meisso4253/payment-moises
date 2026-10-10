import { put, get, del } from '@vercel/blob';
import { getVercelOidcTokenSync } from '@vercel/oidc';

export function receiptStorageReady() {
  if(process.env.BLOB_READ_WRITE_TOKEN)return true;
  if(!process.env.BLOB_STORE_ID)return false;
  // Match the Blob SDK: runtime OIDC may arrive through Vercel's request context
  // rather than a process environment variable. Never expose the token to clients.
  try{return !!getVercelOidcTokenSync();}catch{return false;}
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
