import { eq } from 'drizzle-orm';
import { db } from './index.ts';
import { users } from './schema.ts';

// Designated platform owner email is granted admin privileges on initial sync
const OWNER_ADMIN_EMAILS = new Set(['tsevegnyam.1219@gmail.com']);

export async function getOrCreateUser(uid: string, email: string, displayName?: string) {
  try {
    const existing = await db.select().from(users).where(eq(users.uid, uid));
    const defaultRole = OWNER_ADMIN_EMAILS.has(email.toLowerCase()) ? 'admin' : 'user';

    if (existing.length > 0) {
      const current = existing[0];
      const nextRole = OWNER_ADMIN_EMAILS.has(email.toLowerCase()) ? 'admin' : current.role;
      const nextName = displayName || current.displayName || email.split('@')[0];
      if (current.email !== email || current.role !== nextRole || current.displayName !== nextName) {
        const updated = await db
          .update(users)
          .set({ email, role: nextRole, displayName: nextName })
          .where(eq(users.uid, uid))
          .returning();
        return updated[0];
      }
      return current;
    }

    const inserted = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName: displayName || email.split('@')[0],
        role: defaultRole,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName: displayName || email.split('@')[0],
        },
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Database error in getOrCreateUser:', error);
    throw new Error('Failed to synchronize user account.', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const rows = await db.select().from(users).where(eq(users.uid, uid));
    return rows[0] || null;
  } catch (error) {
    console.error('Database error in getUserByUid:', error);
    throw new Error('Failed to fetch user profile.', { cause: error });
  }
}
