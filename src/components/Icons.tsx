import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function Icon({ children, ...props }: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{children}</svg>
}

// Paths recovered from the legacy bundled Lucide definitions in 1bd8a6f1e7c95853.js.
export function PlusIcon(props: IconProps) { return <Icon {...props}><path d="M5 12h14" /><path d="M12 5v14" /></Icon> }
export function XIcon(props: IconProps) { return <Icon {...props}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Icon> }
export function SearchIcon(props: IconProps) { return <Icon {...props}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></Icon> }
export function SunIcon(props: IconProps) { return <Icon {...props}><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></Icon> }
export function SquareCheckBigIcon(props: IconProps) { return <Icon {...props}><path d="M21 10.656V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.344" /><path d="m9 11 3 3L22 4" /></Icon> }
export function Maximize2Icon(props: IconProps) { return <Icon {...props}><path d="M15 3h6v6" /><path d="m21 3-7 7" /><path d="m3 21 7-7" /><path d="M9 21H3v-6" /></Icon> }
export function Minimize2Icon(props: IconProps) { return <Icon {...props}><path d="m14 10 7-7" /><path d="M20 10h-6V4" /><path d="m3 21 7-7" /><path d="M4 14h6v6" /></Icon> }
export function ChevronDownIcon(props: IconProps) { return <Icon {...props}><path d="m6 9 6 6 6-6" /></Icon> }
export function MoreHorizontalIcon(props: IconProps) { return <Icon {...props}><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></Icon> }
export function CheckIcon(props: IconProps) { return <Icon {...props}><path d="m5 12 4 4L19 6" /></Icon> }
export function GripHorizontalIcon(props: IconProps) { return <Icon {...props}><circle cx="5" cy="9" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="9" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="9" r="1" fill="currentColor" stroke="none" /><circle cx="5" cy="15" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="15" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="15" r="1" fill="currentColor" stroke="none" /></Icon> }
export function PaletteIcon(props: IconProps) { return <Icon {...props}><path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z" /><circle cx="13.5" cy="6.5" r=".5" fill="currentColor" stroke="none" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" stroke="none" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" stroke="none" /><circle cx="8.5" cy="7.5" r=".5" fill="currentColor" stroke="none" /></Icon> }
export function ToggleLeftIcon(props: IconProps) { return <Icon {...props}><circle cx="9" cy="12" r="3" /><rect width="20" height="14" x="2" y="5" rx="7" /></Icon> }
export function ToggleRightIcon(props: IconProps) { return <Icon {...props}><circle cx="15" cy="12" r="3" /><rect width="20" height="14" x="2" y="5" rx="7" /></Icon> }
export function TrashIcon(props: IconProps) { return <Icon {...props}><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></Icon> }
export function FileTextIcon(props: IconProps) { return <Icon {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z" /><path d="M14 2v6h6" /><path d="M8 13h8" /><path d="M8 17h8" /></Icon> }
export function SlidersHorizontalIcon(props: IconProps) { return <Icon {...props}><line x1="21" x2="14" y1="4" y2="4" /><line x1="10" x2="3" y1="4" y2="4" /><line x1="21" x2="12" y1="12" y2="12" /><line x1="8" x2="3" y1="12" y2="12" /><line x1="21" x2="16" y1="20" y2="20" /><line x1="12" x2="3" y1="20" y2="20" /><line x1="14" x2="14" y1="2" y2="6" /><line x1="8" x2="8" y1="10" y2="14" /><line x1="16" x2="16" y1="18" y2="22" /></Icon> }
export function CalendarIcon(props: IconProps) { return <Icon {...props}><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></Icon> }
export function CloudIcon(props: IconProps) { return <Icon {...props}><path d="M17.5 19H9a7 7 0 1 1 6.71-9.02A5 5 0 1 1 17.5 19Z" /></Icon> }
export function FocusIcon(props: IconProps) { return <Icon {...props}><path d="M7.616 8.923h-.77m7.693 0h-.77M9.155 6.258l-.385-.666m3.846 6.662-.384-.666m-3.077 0-.385.666m3.846-6.662-.384.666M11.256 22H5.721c0-.606.088-2.227.442-3.863.442-2.044-1.548-2.045-2.653-5.225C2.405 9.73 2.405 2.232 10.805 2.005s7.528 6.746 7.97 7.655 2.558 4.042 2.558 4.468c0 .643-1.025.804-2.337 1.123 0 .152-.074 1.324-.675 2.886-.75 1.948-3.749 1.59-5.075 1.59-1.061 0 0 2.273-1.99 2.273" /></Icon> }
