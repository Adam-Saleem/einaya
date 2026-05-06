import { router } from '@inertiajs/react';
import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import AppLayout from '@/Layouts/AppLayout';

type ReportRow = { rows: any; totals: Record<string, any> };

type Props = {
    range: { from: string; to: string };
    appointments: ReportRow;
    revenue: ReportRow;
    patients: ReportRow;
    diagnoses: ReportRow;
};

export default function ReportsIndex({ range, appointments, revenue, patients, diagnoses }: Props) {
    const { t } = useTranslation('tenant');

    const apply = (next: Partial<typeof range>) => {
        router.get('/reports', { ...range, ...next }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const exportUrl = (type: string) =>
        `/reports/${type}/export?from=${range.from}&to=${range.to}`;

    return (
        <AppLayout
            title={t('reports.title')}
            pageTitle={t('reports.title')}
            description={t('reports.subtitle')}
        >
            <Card>
                <CardContent className="grid gap-3 p-4 md:grid-cols-[auto_auto_1fr]">
                    <div className="space-y-1">
                        <Label>{t('reports.from')}</Label>
                        <Input
                            type="date"
                            value={range.from.slice(0, 10)}
                            onChange={(e) => apply({ from: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label>{t('reports.to')}</Label>
                        <Input
                            type="date"
                            value={range.to.slice(0, 10)}
                            onChange={(e) => apply({ to: e.target.value })}
                        />
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="appointments">
                <TabsList>
                    <TabsTrigger value="appointments">{t('reports.tabs.appointments')}</TabsTrigger>
                    <TabsTrigger value="revenue">{t('reports.tabs.revenue')}</TabsTrigger>
                    <TabsTrigger value="patients">{t('reports.tabs.patients')}</TabsTrigger>
                    <TabsTrigger value="diagnoses">{t('reports.tabs.diagnoses')}</TabsTrigger>
                </TabsList>

                <TabsContent value="appointments" className="mt-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>{t('reports.appointments.byStatus')}</CardTitle>
                            <Button asChild variant="outline" size="sm">
                                <a href={exportUrl('appointments')}>
                                    <Download className="me-2 h-4 w-4" />
                                    {t('reports.export')}
                                </a>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <p className="mb-3 text-sm text-muted-foreground">
                                {t('reports.appointments.total', { count: appointments.totals.all ?? 0 })}
                            </p>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('reports.appointments.status')}</TableHead>
                                        <TableHead>{t('reports.appointments.count')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(appointments.rows ?? []).map((row: any, i: number) => (
                                        <TableRow key={i}>
                                            <TableCell>{row.status}</TableCell>
                                            <TableCell>{row.count}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="revenue" className="mt-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>{t('reports.revenue.method')}</CardTitle>
                            <Button asChild variant="outline" size="sm">
                                <a href={exportUrl('revenue')}>
                                    <Download className="me-2 h-4 w-4" />
                                    {t('reports.export')}
                                </a>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <p className="mb-3 text-sm text-muted-foreground">
                                {t('reports.revenue.total', {
                                    amount: Number(revenue.totals.amount ?? 0).toLocaleString(undefined, {
                                        style: 'currency',
                                        currency: 'USD',
                                    }),
                                })}
                            </p>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('reports.revenue.method')}</TableHead>
                                        <TableHead>{t('reports.revenue.count')}</TableHead>
                                        <TableHead>{t('reports.revenue.amount')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(revenue.rows ?? []).map((row: any, i: number) => (
                                        <TableRow key={i}>
                                            <TableCell>{row.method}</TableCell>
                                            <TableCell>{row.count}</TableCell>
                                            <TableCell>
                                                {Number(row.amount).toLocaleString(undefined, {
                                                    style: 'currency',
                                                    currency: 'USD',
                                                })}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="patients" className="mt-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>{t('reports.tabs.patients')}</CardTitle>
                            <Button asChild variant="outline" size="sm">
                                <a href={exportUrl('patients')}>
                                    <Download className="me-2 h-4 w-4" />
                                    {t('reports.export')}
                                </a>
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                {t('reports.patients.summary', {
                                    new: patients.totals.new ?? 0,
                                    returning: patients.totals.returning ?? 0,
                                })}
                            </p>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <p className="mb-2 text-sm font-medium">
                                        {t('reports.patients.byGender')}
                                    </p>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t('reports.patients.gender')}</TableHead>
                                                <TableHead>{t('reports.patients.count')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(patients.rows?.gender ?? []).map((row: any, i: number) => (
                                                <TableRow key={i}>
                                                    <TableCell>{row.gender}</TableCell>
                                                    <TableCell>{row.count}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div>
                                    <p className="mb-2 text-sm font-medium">
                                        {t('reports.patients.byAge')}
                                    </p>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t('reports.patients.age')}</TableHead>
                                                <TableHead>{t('reports.patients.count')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(patients.rows?.age ?? []).map((row: any, i: number) => (
                                                <TableRow key={i}>
                                                    <TableCell>{row.bucket}</TableCell>
                                                    <TableCell>{row.count}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="diagnoses" className="mt-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>{t('reports.tabs.diagnoses')}</CardTitle>
                            <Button asChild variant="outline" size="sm">
                                <a href={exportUrl('diagnoses')}>
                                    <Download className="me-2 h-4 w-4" />
                                    {t('reports.export')}
                                </a>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <p className="mb-3 text-sm text-muted-foreground">
                                {t('reports.diagnoses.total', {
                                    unique: diagnoses.totals.unique ?? 0,
                                    total: diagnoses.totals.total ?? 0,
                                })}
                            </p>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('reports.diagnoses.description')}</TableHead>
                                        <TableHead>{t('reports.diagnoses.code')}</TableHead>
                                        <TableHead>{t('reports.diagnoses.count')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(diagnoses.rows ?? []).map((row: any, i: number) => (
                                        <TableRow key={i}>
                                            <TableCell>{row.description}</TableCell>
                                            <TableCell className="font-mono text-xs">{row.code}</TableCell>
                                            <TableCell>{row.count}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </AppLayout>
    );
}
