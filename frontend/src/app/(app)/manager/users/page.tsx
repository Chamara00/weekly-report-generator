import { PageHeader } from '@/components/shared/page-header';
import { Pagination } from '@/components/shared/pagination';
import { ErrorState } from '@/components/shared/error-state';
import { InviteUserForm } from '@/components/manager/invite-user-form';
import { UsersTable } from '@/components/manager/users-table';
import { getCurrentUser, getUsers } from '@/lib/server-api';

export const metadata = { title: 'User management' };

// Admin page: invite people, assign roles, deactivate or remove accounts.
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;

  let users;
  let currentUser;

  try {
    [users, currentUser] = await Promise.all([
      getUsers({ page: Number(page ?? 1), limit: 20 }),
      getCurrentUser(),
    ]);
  } catch (error) {
    return (
      <ErrorState
        title="Could not load users"
        message={error instanceof Error ? error.message : 'The API did not respond.'}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="User management"
        description="Invite team members, assign roles, and deactivate accounts."
      />

      <div className="space-y-6">
        <InviteUserForm />
        <UsersTable users={users.data} currentUser={currentUser} />
        <Pagination
          page={users.meta.page}
          totalPages={users.meta.totalPages}
          total={users.meta.total}
          limit={users.meta.limit}
        />
      </div>
    </>
  );
}
