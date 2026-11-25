import { CarFront, Dribbble, Grid2X2, Swords, Volleyball, type LucideProps } from 'lucide-react';
import type { SVGProps } from 'react';

type Props = SVGProps<SVGSVGElement> & { sport: string };

/** Consistent, decorative line icons for sport navigation. */
export default function SportIcon({sport,...props}:Props) {
 const shared={...props, 'aria-hidden': true as const};
 const iconProps=shared as LucideProps;
 if(sport==='basketball') return <Dribbble {...iconProps}/>;
 if(sport==='volleyball') return <Volleyball {...iconProps}/>;
 if(sport==='ufc') return <Swords {...iconProps}/>;
 if(sport==='f1') return <CarFront {...iconProps}/>;
 if(sport==='other') return <Grid2X2 {...iconProps}/>;
 return <svg {...shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
  {sport==='football' ? <><circle cx="12" cy="12" r="9"/><path d="m12 8 3 2.2-1.1 3.5h-3.8L9 10.2 12 8ZM12 3v5M3.8 9l5.2 1.2m1.1 3.5-3 4.7m6.8-4.7 3 4.7M15 10.2 20.2 9"/></> : sport==='tennis' ? <><circle cx="12" cy="12" r="9"/><path d="M6 5.3c4 2 4 11.4 0 13.4m12-13.4c-4 2-4 11.4 0 13.4"/></> : sport==='baseball' ? <><circle cx="12" cy="12" r="9"/><path d="M6 5c4 3 4 11 0 14M18 5c-4 3-4 11 0 14M6.7 8l2 1M7.2 11l2 .5M7.2 14l2-.5M6.7 17l2-1M17.3 8l-2 1m1.5 2-2 .5m1.5 2.5-2-.5m1.5 3.5-2-1"/></> : <><circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/></>}
 </svg>;
}
