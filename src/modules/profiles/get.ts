import { db } from '../../db/client';
import { users } from '../../db/schema/index';
import { eq } from 'drizzle-orm';

export async function getPublicProfile(username: string) {
  const [profile] = await db
    .select({
      githubUserId: users.githubUserId,
      username: users.username,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
      links: users.links,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  return profile ?? null;
}
