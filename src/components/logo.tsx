import { Briefcase } from 'lucide-react';

export default function Logo() {
  return (
    <div className="flex items-center gap-2">
       <div className="flex items-center justify-center size-8 bg-primary text-primary-foreground rounded-md">
            <Briefcase className="h-5 w-5" />
       </div>
       <span className="text-xl font-bold text-foreground">VerticalSync</span>
    </div>
  );
}
