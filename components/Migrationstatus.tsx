// components/MigrationStatus.tsx
import { featureFlags } from '@/lib/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HardDrive, Cloud } from 'lucide-react';

export function MigrationStatus() {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Estado de la Migración a MySQL</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {Object.entries(featureFlags).map(([key, value]) => (
            <li key={key} className="flex justify-between items-center p-2 rounded-md bg-muted/50">
              <span className="capitalize font-medium">{key.replace(/([A-Z])/g, ' $1')}</span>
              <span className={`flex items-center gap-2 font-bold px-2 py-1 rounded-full text-xs ${
                value === 'mysql'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {value === 'mysql' ? <HardDrive size={14} /> : <Cloud size={14} />}
                {value.toUpperCase()}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}