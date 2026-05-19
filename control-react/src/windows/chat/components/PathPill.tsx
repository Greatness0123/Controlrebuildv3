import React from 'react';
import { Tooltip } from '../../components/shared/Tooltip';

interface PathPillProps {
  path: string;
}

export const PathPill: React.FC<PathPillProps> = ({ path }) => {
  const fileName = path.split(/[/\\]/).pop() || path;
  const shortenedLabel = fileName.length > 20 ? `${fileName.substring(0, 17)}...` : fileName;

  return (
    <Tooltip content={path}>
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800 cursor-default mx-0.5">
        {shortenedLabel}
      </span>
    </Tooltip>
  );
};
