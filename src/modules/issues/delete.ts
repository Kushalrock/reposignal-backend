import { db } from '../../db/client';
import { issues, repositories } from '../../db/schema/index';
import { writeLog } from '../logs/writer';
import { eq } from 'drizzle-orm';

export type DeleteIssueParams = {
  githubIssueId: number;
  githubRepoId: number;
  actor: { type: 'bot' } | { type: 'user'; githubId: number; username: string };
};

export async function deleteIssue(data: DeleteIssueParams) {
  const { githubIssueId, githubRepoId, actor } = data;

  // Get repository to validate it exists
  const [repo] = await db
    .select()
    .from(repositories)
    .where(eq(repositories.githubRepoId, githubRepoId))
    .limit(1);

  if (!repo) {
    throw new Error(`Repository not found: ${githubRepoId}`);
  }

  // Check if issue exists
  const [existingIssue] = await db
    .select()
    .from(issues)
    .where(eq(issues.githubIssueId, githubIssueId))
    .limit(1);

  if (!existingIssue) {
    throw new Error(`Issue not found: ${githubIssueId}`);
  }

  // Delete the issue
  await db.delete(issues).where(eq(issues.githubIssueId, githubIssueId));

  // Log deletion
  await writeLog({
    actor: actor.type === 'bot' ? { type: 'bot' } : { type: 'user', githubId: actor.githubId, username: actor.username },
    action: 'issue_deleted',
    entityType: 'issue',
    entityId: `issue:${repo.owner}/${repo.name}#${githubIssueId}`,
    context: { githubIssueId, githubRepoId },
  });

  return { success: true, deletedIssueId: existingIssue.id };
}
