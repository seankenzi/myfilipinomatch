import { useRef, useState, useEffect, forwardRef, type ReactNode } from "react";

interface LazySectionProps {
  children: ReactNode;
  className?: string;
  rootMargin?: string;
}

const LazySection = forwardRef<HTMLDivElement, LazySectionProps>(
  ({ children, className = "", rootMargin = "200px" }, forwardedRef) => {
    const internalRef = useRef<HTMLDivElement>(null);

    // Use internal ref for IntersectionObserver, forward ref for parent
    const ref = (forwardedRef as React.RefObject<HTMLDivElement>) || internalRef;
    const observerRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      const el = observerRef.current;
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { rootMargin }
      );

      observer.observe(el);
      return () => observer.disconnect();
    }, [rootMargin]);

    return (
      <div ref={(node) => {
        (observerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }} className={className}>
        {isVisible ? (
          <div className="animate-fade-in">{children}</div>
        ) : (
          <div style={{ minHeight: 200 }} />
        )}
      </div>
    );
  }
);

LazySection.displayName = "LazySection";

export default LazySection;
