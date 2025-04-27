'use client';

import * as React from 'react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: React.ReactNode;
  withSeparator?: boolean;
}

export function SectionHeader({
  title,
  description,
  action,
  withSeparator = true,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      {withSeparator && <Separator className="my-2" />}
    </div>
  );
}
