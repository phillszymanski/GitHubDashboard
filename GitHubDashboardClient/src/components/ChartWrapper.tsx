import { type ReactNode } from 'react';

interface ChartWrapperProps {
  title: string;
  children: ReactNode;
  isEmpty?: boolean;
  emptyMessage?: string;
}

export default function ChartWrapper({ 
  title, 
  children, 
  isEmpty = false, 
  emptyMessage = 'No data to display' 
}: ChartWrapperProps) {
  return (
    <div>
      <h3>{title}</h3>
      {isEmpty ? (
        <p style={{ color: '#888', fontStyle: 'italic', padding: '20px 0' }}>
          {emptyMessage}
        </p>
      ) : (
        children
      )}
    </div>
  );
}
