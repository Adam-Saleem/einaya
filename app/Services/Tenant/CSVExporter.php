<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use Symfony\Component\HttpFoundation\StreamedResponse;

class CSVExporter
{
    /**
     * Stream a UTF-8 BOM CSV to the browser. The BOM keeps Excel happy when
     * the file contains Arabic text.
     *
     * @param  list<string>  $headers
     * @param  iterable<array<int|string, mixed>>  $rows
     */
    public function stream(string $filename, array $headers, iterable $rows): StreamedResponse
    {
        return response()->streamDownload(function () use ($headers, $rows): void {
            $out = fopen('php://output', 'wb');
            // UTF-8 BOM
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, $headers);
            foreach ($rows as $row) {
                fputcsv($out, array_map(fn ($v) => $this->normalize($v), array_values($row)));
            }
            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=utf-8',
        ]);
    }

    private function normalize(mixed $value): string
    {
        if ($value === null) return '';
        if (is_bool($value)) return $value ? '1' : '0';
        if ($value instanceof \BackedEnum) return (string) $value->value;
        if ($value instanceof \DateTimeInterface) return $value->format('Y-m-d H:i:s');
        if (is_array($value)) return json_encode($value, JSON_UNESCAPED_UNICODE);
        return (string) $value;
    }
}
