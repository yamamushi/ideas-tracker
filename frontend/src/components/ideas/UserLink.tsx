import React from 'react';
import { Link } from 'react-router-dom';
import { User } from 'lucide-react';
import clsx from 'clsx';

interface UserLinkProps {
  userId: number;
  username: string;
  isAdmin?: boolean;
  showIcon?: boolean;
  className?: string;
}

export function UserLink({ userId, username, isAdmin, showIcon = true, className }: UserLinkProps) {
  return (
    <Link
      to={`/profile/${userId}`}
      className={clsx(
        'inline-flex items-center hover:text-primary-400 transition-colors',
        className
      )}
    >
      {showIcon && <User className="h-4 w-4 mr-1" />}
      <span className={clsx(isAdmin && 'font-semibold')}>
        {username}
        {isAdmin && (
          <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary-500 text-white rounded">
            Admin
          </span>
        )}
      </span>
    </Link>
  );
}