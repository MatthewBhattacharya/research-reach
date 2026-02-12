import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const profile = sqliteTable('profile', {
  id: integer('id').primaryKey().$defaultFn(() => 1),
  name: text('name').notNull(),
  email: text('email').notNull(),
  university: text('university'),
  department: text('department'),
  researchInterests: text('research_interests'),
  cvPath: text('cv_path'),
  cvText: text('cv_text'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
})

export const searches = sqliteTable('searches', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  universityName: text('university_name').notNull(),
  keywords: text('keywords').notNull(),
  departmentUrl: text('department_url'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
})

export const professors = sqliteTable('professors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  searchId: integer('search_id').references(() => searches.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  title: text('title'),
  department: text('department'),
  profileUrl: text('profile_url'),
  email: text('email'),
  researchSummary: text('research_summary'),
  imageUrl: text('image_url'),
  relevanceScore: real('relevance_score'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
})

export const papers = sqliteTable('papers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  professorId: integer('professor_id').references(() => professors.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  authors: text('authors'),
  abstract: text('abstract'),
  url: text('url'),
  year: integer('year'),
  source: text('source'),
  relevanceScore: real('relevance_score'),
  aiSummary: text('ai_summary'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
})

export const contacts = sqliteTable('contacts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  professorId: integer('professor_id').references(() => professors.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  role: text('role'),
  email: text('email'),
  profileUrl: text('profile_url'),
  isRecommendedContact: integer('is_recommended_contact', { mode: 'boolean' }).default(false),
  recommendationReason: text('recommendation_reason')
})

export const emails = sqliteTable('emails', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  professorId: integer('professor_id').references(() => professors.id, { onDelete: 'cascade' }),
  contactId: integer('contact_id').references(() => contacts.id),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  recipientEmail: text('recipient_email'),
  status: text('status').default('draft'),
  workPeriod: text('work_period'),
  selectedPapers: text('selected_papers'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  sentAt: text('sent_at')
})

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull()
})

export type Profile = typeof profile.$inferSelect
export type NewProfile = typeof profile.$inferInsert
export type Search = typeof searches.$inferSelect
export type NewSearch = typeof searches.$inferInsert
export type Professor = typeof professors.$inferSelect
export type NewProfessor = typeof professors.$inferInsert
export type Paper = typeof papers.$inferSelect
export type NewPaper = typeof papers.$inferInsert
export type Contact = typeof contacts.$inferSelect
export type NewContact = typeof contacts.$inferInsert
export type Email = typeof emails.$inferSelect
export type NewEmail = typeof emails.$inferInsert
export type Setting = typeof settings.$inferSelect
