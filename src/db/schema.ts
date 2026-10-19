import { pgTable, uuid, varchar, boolean, text, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable('users',{
    id : uuid('id').primaryKey().defaultRandom(),

    firstName : varchar('first_name', { length : 45 }).notNull(),
    lastName : varchar('last_name', { length : 45 }),

    email : varchar('email', {length : 322}).notNull().unique(),
    emailVerified : boolean('email_verified').default(false).notNull(),

    password : varchar('password',  {length : 66}),
    salt : text('salt'),

    createdAt : timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
})


export const appsTable = pgTable('apps', {
    id : uuid('id').primaryKey().defaultRandom(),
    name : varchar('name', { length : 100 }).notNull(),
    clientId : varchar('client_id').unique().notNull(),
    clientSecret : varchar('client_secret').notNull(),
    redirectUrl : varchar('redirect_url', { length : 200 }).notNull(),
})

