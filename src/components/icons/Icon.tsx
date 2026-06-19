import type { SVGProps } from 'react'
import { ICON_INNER, type IconName } from './paths'

export type { IconName }

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  size?: number
  strokeWidth?: number
}

// Renders an outline (Lucide) icon. Inherits color via `currentColor`.
export function Icon({ name, size = 24, strokeWidth = 2, className, ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICON_INNER[name] }}
      {...rest}
    />
  )
}
