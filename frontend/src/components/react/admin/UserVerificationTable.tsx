import React, { useState } from 'react';
import type { User } from '../../../types';
import { MOCK_USERS } from '../../../lib/mockData';
import { VerificationBadge } from '../ui/VerificationBadge';
import { SquareButton } from '../ui/SquareButton';
import { EmptyState } from '../ui/EmptyState';
import { addToast } from '../../../stores/toastStore';
import { Check, X, ShieldCheck, Users } from 'lucide-react';

export const UserVerificationTable: React.FC = () => {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);

  const handleVerify = (userId: string, status: boolean) => {
    setUsers(users.map((u) => (u.id === userId ? { ...u, verified: status } : u)));
    addToast({
      type: status ? 'success' : 'info',
      title: status ? 'User Account Verified' : 'Verification Revoked',
      message: `User status updated.`,
    });
  };

  return (
    <div className="bg-white border border-[#ebebeb] rounded-xl overflow-hidden shadow-xs">
      <div className="p-5 border-b border-[#ebebeb] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-[#0070f3]" />
          <div>
            <h3 className="text-base font-bold text-[#171717]">User Identity Verification</h3>
            <p className="text-xs text-[#8f8f8f]">Review farmer and buyer registration credentials</p>
          </div>
        </div>
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={<Users className="w-6 h-6" />}
          title="No Users Pending Verification"
          description="All registered farmers and commercial buyers have been verified."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#fafafa] border-b border-[#ebebeb] text-[11px] font-mono-eyebrow text-[#8f8f8f]">
              <tr>
                <th scope="col" className="px-5 py-3">NAME & CONTACT</th>
                <th scope="col" className="px-5 py-3">ROLE</th>
                <th scope="col" className="px-5 py-3">STATUS</th>
                <th scope="col" className="px-5 py-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebebeb]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#fafafa]/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-[#171717]">{u.name}</div>
                    <div className="text-xs text-[#8f8f8f]">{u.email}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="capitalize text-xs font-medium px-2 py-0.5 rounded bg-[#fafafa] border border-[#ebebeb]">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {u.verified ? (
                      <VerificationBadge />
                    ) : (
                      <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        Pending Review
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {u.verified ? (
                      <SquareButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVerify(u.id, false)}
                        icon={<X className="w-3.5 h-3.5 text-rose-600" />}
                      >
                        Revoke
                      </SquareButton>
                    ) : (
                      <SquareButton
                        variant="success"
                        size="sm"
                        onClick={() => handleVerify(u.id, true)}
                        icon={<Check className="w-3.5 h-3.5" />}
                      >
                        Verify
                      </SquareButton>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
