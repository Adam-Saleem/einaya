<?php

declare(strict_types=1);

namespace App\Enums\Tenant;

enum FormQuestionType: string
{
    case Text = 'text';
    case Textarea = 'textarea';
    case Number = 'number';
    case Radio = 'radio';
    case Checkbox = 'checkbox';
    case Select = 'select';
    case Date = 'date';
    case File = 'file';
    case Signature = 'signature';

    public function hasOptions(): bool
    {
        return in_array($this, [self::Radio, self::Checkbox, self::Select], true);
    }

    public function label(): string
    {
        return match ($this) {
            self::Text => 'Text',
            self::Textarea => 'Long Text',
            self::Number => 'Number',
            self::Radio => 'Single Choice',
            self::Checkbox => 'Multiple Choice',
            self::Select => 'Dropdown',
            self::Date => 'Date',
            self::File => 'File Upload',
            self::Signature => 'Signature',
        };
    }
}
