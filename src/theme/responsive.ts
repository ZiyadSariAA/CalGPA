import { useWindowDimensions } from 'react-native';

/** Breakpoints */
const TABLET_MIN = 768;
const DESKTOP_MIN = 1024;

/** Max content width so layouts don't stretch on iPad (kept for backward compat) */
export const MAX_CONTENT_WIDTH = 600;

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= TABLET_MIN;
  const isDesktop = width >= DESKTOP_MIN;
  const isLandscape = width > height;

  /** Scale factor for font sizes: 1x on phone, up to 1.15x on tablet */
  const fontScale = isTablet ? 1.15 : 1;

  /** Number of grid columns based on width */
  const gridColumns = width >= DESKTOP_MIN ? 4 : width >= TABLET_MIN ? 3 : 2;

  /** Dynamic max content width based on device and orientation */
  const maxContentWidth = isTablet
    ? isLandscape
      ? Math.min(width * 0.75, 960)
      : Math.min(width * 0.85, 700)
    : width;

  return {
    width,
    height,
    isTablet,
    isDesktop,
    isLandscape,
    fontScale,
    gridColumns,
    maxContentWidth,
  };
}
