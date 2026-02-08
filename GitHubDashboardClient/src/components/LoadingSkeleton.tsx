interface LoadingSkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export default function LoadingSkeleton({ 
  variant = 'rectangular', 
  width = '100%', 
  height = '20px',
  count = 1 
}: LoadingSkeletonProps) {
  const baseStyle: React.CSSProperties = {
    backgroundColor: '#e0e0e0',
    backgroundImage: 'linear-gradient(90deg, #e0e0e0 0%, #f0f0f0 50%, #e0e0e0 100%)',
    backgroundSize: '200% 100%',
    animation: 'skeleton-loading 1.5s ease-in-out infinite',
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  const variantStyle: React.CSSProperties = {
    borderRadius: variant === 'circular' ? '50%' : variant === 'text' ? '4px' : '8px',
  };

  return (
    <>
      <style>
        {`
          @keyframes skeleton-loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}
      </style>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          role="status"
          aria-label="Loading"
          style={{
            ...baseStyle,
            ...variantStyle,
            marginBottom: index < count - 1 ? '8px' : 0,
          }}
        />
      ))}
    </>
  );
}
