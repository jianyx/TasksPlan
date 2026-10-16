'use client';
import { useEffect, useRef } from 'react';
import lottie, { AnimationItem } from 'lottie-web';

type Props = {
  iconName: string;
  size?: number;
  className?: string;
};

export function WeatherAnimation({ iconName, size = 80, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // 动态导入对应的 JSON，避免打包时全部加载
      let animationData: any;
      try {
        animationData = await import(
          `@meteocons/lottie/fill/${iconName}.json`
        );
      } catch {
        // 图标不存在时回退到 clear-day
        animationData = await import(
          `@meteocons/lottie/fill/clear-day.json`
        );
      }

      if (cancelled || !containerRef.current) return;

      if (animRef.current) animRef.current.destroy();
      animRef.current = lottie.loadAnimation({
        container: containerRef.current,
        animationData: animationData.default || animationData,
        loop: true,
        autoplay: true,
        renderer: 'svg',
      });
    }

    load();
    return () => {
      cancelled = true;
      if (animRef.current) animRef.current.destroy();
    };
  }, [iconName]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}