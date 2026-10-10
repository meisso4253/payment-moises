import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
export const payments = sqliteTable('payments', {
  id:text('id').primaryKey(), userId:text('user_id').notNull(), name:text('name').notNull(), email:text('email').notNull(),
  reference:text('reference').notNull().unique(), amount:integer('amount').notNull(), duration:integer('duration').notNull(),
  paidAt:text('paid_at').notNull(), createdAt:integer('created_at').notNull(), status:text('status').notNull(),
  proofKey:text('proof_key').notNull(), proofType:text('proof_type').notNull(), proofName:text('proof_name').notNull(),
  recipientName:text('recipient_name').notNull(), recipientNumber:text('recipient_number').notNull(),
  reviewedAt:integer('reviewed_at'), reviewedBy:text('reviewed_by'), reviewNote:text('review_note'),
},t=>[uniqueIndex('one_pending_payment_per_customer').on(t.userId).where(sql`${t.status} = 'pending'`)]);
export const grants = sqliteTable('grants', {
  paymentId:text('payment_id').primaryKey().references(()=>payments.id), userId:text('user_id').notNull(),
  startsAt:integer('starts_at').notNull(), endsAt:integer('ends_at').notNull(),
});
export const planners = sqliteTable('planners', {
  userId:text('user_id').primaryKey(), data:text('data').notNull(), version:integer('version').notNull(),
});

// Better Auth's Google provider account (Google sub), user, and database sessions.
export const user=sqliteTable('auth_user',{
  id:text('id').primaryKey(),name:text('name').notNull(),email:text('email').notNull().unique(),
  emailVerified:integer('email_verified',{mode:'boolean'}).notNull().default(false),image:text('image'),
  createdAt:integer('created_at',{mode:'timestamp_ms'}).notNull(),updatedAt:integer('updated_at',{mode:'timestamp_ms'}).notNull(),
});
export const session=sqliteTable('auth_session',{
  id:text('id').primaryKey(),expiresAt:integer('expires_at',{mode:'timestamp_ms'}).notNull(),token:text('token').notNull().unique(),
  createdAt:integer('created_at',{mode:'timestamp_ms'}).notNull(),updatedAt:integer('updated_at',{mode:'timestamp_ms'}).notNull(),
  ipAddress:text('ip_address'),userAgent:text('user_agent'),userId:text('user_id').notNull().references(()=>user.id,{onDelete:'cascade'}),
},t=>[index('auth_session_user_idx').on(t.userId)]);
export const account=sqliteTable('auth_account',{
  id:text('id').primaryKey(),accountId:text('account_id').notNull(),providerId:text('provider_id').notNull(),
  userId:text('user_id').notNull().references(()=>user.id,{onDelete:'cascade'}),
  accessToken:text('access_token'),refreshToken:text('refresh_token'),idToken:text('id_token'),
  accessTokenExpiresAt:integer('access_token_expires_at',{mode:'timestamp_ms'}),refreshTokenExpiresAt:integer('refresh_token_expires_at',{mode:'timestamp_ms'}),
  scope:text('scope'),password:text('password'),createdAt:integer('created_at',{mode:'timestamp_ms'}).notNull(),updatedAt:integer('updated_at',{mode:'timestamp_ms'}).notNull(),
},t=>[index('auth_account_user_idx').on(t.userId),uniqueIndex('auth_provider_subject_idx').on(t.providerId,t.accountId)]);
export const verification=sqliteTable('auth_verification',{
  id:text('id').primaryKey(),identifier:text('identifier').notNull(),value:text('value').notNull(),
  expiresAt:integer('expires_at',{mode:'timestamp_ms'}).notNull(),createdAt:integer('created_at',{mode:'timestamp_ms'}).notNull(),updatedAt:integer('updated_at',{mode:'timestamp_ms'}).notNull(),
},t=>[index('auth_verification_identifier_idx').on(t.identifier)]);
export const rateLimit=sqliteTable('auth_rate_limit',{
  id:text('id').primaryKey(),key:text('key').notNull().unique(),count:integer('count').notNull(),lastRequest:integer('last_request').notNull(),
});
// Preserve the app's existing record keys when a verified Google account is linked.
export const identityLinks=sqliteTable('identity_links',{
  authUserId:text('auth_user_id').primaryKey().references(()=>user.id),appUserId:text('app_user_id').notNull().unique(),
});
export const legacyIdentities=sqliteTable('legacy_identities',{
  userId:text('user_id').primaryKey(),email:text('email').notNull(),
},t=>[index('legacy_identity_email_idx').on(t.email)]);
