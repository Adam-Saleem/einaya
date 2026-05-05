import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/Components/domain/ConfirmDialog';
import { DataTable } from '@/Components/domain/DataTable';
import { EmptyState } from '@/Components/domain/EmptyState';
import { FormModal } from '@/Components/domain/FormModal';
import { LoadingSpinner } from '@/Components/domain/LoadingSpinner';
import { PageSkeleton } from '@/Components/domain/PageSkeleton';
import { StatusBadge, type StatusVariant } from '@/Components/domain/StatusBadge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/Components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/Components/ui/alert';
import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Checkbox } from '@/Components/ui/checkbox';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/Components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { Switch } from '@/Components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Textarea } from '@/Components/ui/textarea';
import AppLayout from '@/Layouts/AppLayout';
import CentralLayout from '@/Layouts/CentralLayout';

type Props = {
    context: 'central' | 'tenant';
};

type DemoRow = {
    name: string;
    email: string;
    status: 'active' | 'pending' | 'suspended';
};

const tokenSwatches = [
    { name: 'background', class: 'bg-background border' },
    { name: 'foreground', class: 'bg-foreground' },
    { name: 'card', class: 'bg-card border' },
    { name: 'primary', class: 'bg-primary' },
    { name: 'secondary', class: 'bg-secondary' },
    { name: 'muted', class: 'bg-muted border' },
    { name: 'accent', class: 'bg-accent' },
    { name: 'destructive', class: 'bg-destructive' },
    { name: 'success', class: 'bg-success' },
    { name: 'warning', class: 'bg-warning' },
    { name: 'info', class: 'bg-info' },
    { name: 'border', class: 'bg-border' },
];

const statusVariants: { variant: StatusVariant; label: string }[] = [
    { variant: 'success', label: 'Success' },
    { variant: 'warning', label: 'Warning' },
    { variant: 'info', label: 'Info' },
    { variant: 'danger', label: 'Danger' },
    { variant: 'neutral', label: 'Neutral' },
];

const demoRows: DemoRow[] = [
    { name: 'Lina Habash', email: 'lina@demo.einaya.test', status: 'active' },
    { name: 'Omar Khalil', email: 'omar@demo.einaya.test', status: 'pending' },
    { name: 'Yasmin Saleh', email: 'yasmin@demo.einaya.test', status: 'active' },
    { name: 'Tareq Nasser', email: 'tareq@demo.einaya.test', status: 'suspended' },
];

export default function DesignSystem({ context }: Props) {
    const { t } = useTranslation('common');
    const [formOpen, setFormOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const Layout = context === 'central' ? CentralLayout : AppLayout;

    return (
        <Layout
            title="Design System"
            pageTitle="Design System"
            description="Visual identity reference. Verify here before shipping any new screen."
            breadcrumbs={[{ label: 'Design System' }]}
        >
            <Card>
                <CardHeader>
                    <CardTitle>Color tokens</CardTitle>
                    <CardDescription>
                        Each token is a CSS variable rendered through Tailwind.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-6">
                        {tokenSwatches.map((swatch) => (
                            <div key={swatch.name} className="flex flex-col gap-2">
                                <div className={`h-16 rounded-md ${swatch.class}`} />
                                <code className="text-xs text-muted-foreground">{swatch.name}</code>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Typography</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-display">Display — 48</p>
                    <p className="text-h1">Heading 1 — 36</p>
                    <p className="text-h2">Heading 2 — 24</p>
                    <p className="text-h3">Heading 3 — 18</p>
                    <p className="text-h4">Heading 4 — 16</p>
                    <p className="text-md">Medium body — 16</p>
                    <p className="text-base">Base body — 14</p>
                    <p className="text-sm text-muted-foreground">Small / muted — 13</p>
                    <p className="text-xs text-muted-foreground">Extra small — 12</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Buttons</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                    <Button>Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="link">Link</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button size="sm">Small</Button>
                    <Button size="lg">Large</Button>
                    <Button disabled>
                        <LoadingSpinner size="sm" className="me-2" />
                        Loading
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Form fields</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="ds-input">Input</Label>
                        <Input id="ds-input" placeholder="Email address" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ds-textarea">Textarea</Label>
                        <Textarea id="ds-textarea" placeholder="Notes" />
                    </div>
                    <div className="space-y-2">
                        <Label>Select</Label>
                        <Select defaultValue="ar">
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="ar">العربية</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Radio</Label>
                        <RadioGroup defaultValue="weekly" className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <RadioGroupItem value="daily" id="ds-daily" />
                                <Label htmlFor="ds-daily">Daily</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <RadioGroupItem value="weekly" id="ds-weekly" />
                                <Label htmlFor="ds-weekly">Weekly</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <RadioGroupItem value="monthly" id="ds-monthly" />
                                <Label htmlFor="ds-monthly">Monthly</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox id="ds-checkbox" defaultChecked />
                        <Label htmlFor="ds-checkbox">Email me a daily summary</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch id="ds-switch" />
                        <Label htmlFor="ds-switch">Enable feature</Label>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Status badges</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    {statusVariants.map((s) => (
                        <StatusBadge key={s.variant} variant={s.variant}>
                            {s.label}
                        </StatusBadge>
                    ))}
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                    <Badge variant="outline">Outline</Badge>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Alerts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Alert>
                        <AlertTitle>Heads up</AlertTitle>
                        <AlertDescription>
                            Default alert with neutral tone for informational copy.
                        </AlertDescription>
                    </Alert>
                    <Alert variant="destructive">
                        <AlertTitle>Something went wrong</AlertTitle>
                        <AlertDescription>
                            Destructive alert for errors and irrecoverable actions.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Data table</CardTitle>
                </CardHeader>
                <CardContent>
                    <DataTable<DemoRow, unknown>
                        data={demoRows}
                        columns={[
                            { accessorKey: 'name', header: 'Name' },
                            { accessorKey: 'email', header: 'Email' },
                            {
                                accessorKey: 'status',
                                header: 'Status',
                                cell: ({ row }) => {
                                    const value = row.original.status;
                                    const map: Record<DemoRow['status'], StatusVariant> = {
                                        active: 'success',
                                        pending: 'warning',
                                        suspended: 'danger',
                                    };
                                    return (
                                        <StatusBadge variant={map[value]}>{value}</StatusBadge>
                                    );
                                },
                            },
                            {
                                id: 'actions',
                                header: '',
                                cell: () => (
                                    <div className="flex items-center justify-end gap-1">
                                        <Button variant="ghost" size="icon" aria-label="Edit">
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" aria-label="Delete">
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ),
                            },
                        ]}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Avatars & tabs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarFallback className="bg-primary text-primary-foreground">
                                LH
                            </AvatarFallback>
                        </Avatar>
                        <Avatar>
                            <AvatarFallback>OK</AvatarFallback>
                        </Avatar>
                        <Avatar>
                            <AvatarFallback className="bg-secondary text-secondary-foreground">
                                YS
                            </AvatarFallback>
                        </Avatar>
                    </div>
                    <Tabs defaultValue="overview">
                        <TabsList>
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="activity">Activity</TabsTrigger>
                            <TabsTrigger value="settings">Settings</TabsTrigger>
                        </TabsList>
                        <TabsContent value="overview" className="mt-3 text-sm text-muted-foreground">
                            High-level summary of recent activity.
                        </TabsContent>
                        <TabsContent value="activity" className="mt-3 text-sm text-muted-foreground">
                            Detailed event log.
                        </TabsContent>
                        <TabsContent value="settings" className="mt-3 text-sm text-muted-foreground">
                            Workspace preferences and integrations.
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Accordion</CardTitle>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible>
                        <AccordionItem value="a">
                            <AccordionTrigger>Why is the base font 14?</AccordionTrigger>
                            <AccordionContent>
                                Medical UIs need data density without sacrificing legibility.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="b">
                            <AccordionTrigger>How do I localize my page?</AccordionTrigger>
                            <AccordionContent>
                                Use the <code>useTranslation()</code> hook with the right namespace
                                and keep all strings in JSON files under{' '}
                                <code>resources/js/locales</code>.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Dialogs & toasts</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                    <FormModal
                        open={formOpen}
                        onOpenChange={setFormOpen}
                        trigger={<Button variant="outline">Open form modal</Button>}
                        title="Edit profile"
                        description="Update display name and email."
                        onSubmit={(event) => {
                            event.preventDefault();
                            setFormOpen(false);
                            toast.success(t('status.saved'));
                        }}
                    >
                        <div className="space-y-2">
                            <Label htmlFor="ds-modal-name">Name</Label>
                            <Input id="ds-modal-name" defaultValue="Lina Habash" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ds-modal-email">Email</Label>
                            <Input
                                id="ds-modal-email"
                                type="email"
                                defaultValue="lina@demo.einaya.test"
                            />
                        </div>
                    </FormModal>

                    <ConfirmDialog
                        open={confirmOpen}
                        onOpenChange={setConfirmOpen}
                        trigger={<Button variant="destructive">Delete account</Button>}
                        title="Delete this account?"
                        description="This action cannot be undone."
                        onConfirm={() => {
                            setConfirmOpen(false);
                            toast.error('Account deleted');
                        }}
                    />

                    <Button
                        variant="outline"
                        onClick={() => toast.success('Saved successfully')}
                    >
                        Trigger toast
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => toast.error('Something went wrong')}
                    >
                        Error toast
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Empty / loading states</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                    <EmptyState
                        title="No patients yet"
                        description="When you register a patient, they'll appear here."
                        action={<Button size="sm">Add patient</Button>}
                    />
                    <PageSkeleton />
                </CardContent>
            </Card>
        </Layout>
    );
}
