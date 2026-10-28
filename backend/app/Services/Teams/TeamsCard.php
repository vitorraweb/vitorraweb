<?php

namespace App\Services\Teams;

use Illuminate\Support\Str;

/**
 * A short Teams message as an Adaptive Card, in the payload shape the Teams
 * Workflows template "Send webhook alerts to a channel" expects:
 *
 *   {"type":"message","attachments":[{"contentType":
 *     "application/vnd.microsoft.card.adaptive","contentUrl":null,
 *     "content":{ …AdaptiveCard… }}]}
 *
 * Everything is plain text (Adaptive Cards render a little Markdown, so it is
 * neutralised) and bounded in length — Teams refuses messages over ~28 KB.
 */
final class TeamsCard
{
    /** @var array<int, array{0:string,1:string}> */
    private array $facts = [];

    private ?string $text = null;

    private ?string $url = null;

    private string $button = 'Open in Vitorra';

    public function __construct(private string $title) {}

    public static function make(string $title): self
    {
        return new self($title);
    }

    public function fact(string $label, mixed $value): self
    {
        if ($value !== null && $value !== '' && count($this->facts) < 12) {
            $this->facts[] = [self::clean($label, 60), self::clean((string) $value, 200)];
        }

        return $this;
    }

    public function text(?string $text): self
    {
        $this->text = $text !== null && trim($text) !== '' ? self::clean($text, 600) : null;

        return $this;
    }

    /** A link back to a (signed-in) console page. Only https URLs are used. */
    public function link(string $url, string $button = 'Open in Vitorra'): self
    {
        $this->url = str_starts_with($url, 'https://') ? $url : null;
        $this->button = self::clean($button, 40);

        return $this;
    }

    public function title(): string
    {
        return self::clean($this->title, 150);
    }

    /** @return array<string,mixed> */
    public function payload(): array
    {
        $body = [
            ['type' => 'TextBlock', 'text' => $this->title(), 'weight' => 'Bolder', 'size' => 'Medium', 'wrap' => true],
        ];
        if ($this->text) {
            $body[] = ['type' => 'TextBlock', 'text' => $this->text, 'wrap' => true, 'spacing' => 'Small'];
        }
        if ($this->facts) {
            $body[] = ['type' => 'FactSet', 'facts' => array_map(fn ($f) => ['title' => $f[0], 'value' => $f[1]], $this->facts)];
        }

        $card = [
            '$schema' => 'http://adaptivecards.io/schemas/adaptive-card.json',
            'type'    => 'AdaptiveCard',
            'version' => '1.4',
            'body'    => $body,
        ];
        if ($this->url) {
            $card['actions'] = [['type' => 'Action.OpenUrl', 'title' => $this->button, 'url' => $this->url]];
        }

        return [
            'type'        => 'message',
            'attachments' => [[
                'contentType' => 'application/vnd.microsoft.card.adaptive',
                'contentUrl'  => null,
                'content'     => $card,
            ]],
        ];
    }

    /**
     * Plain, single-spaced, bounded. Square brackets become parentheses so
     * text typed into a public form can never become a disguised Markdown
     * link ("[Your invoice](https://…)") in the channel.
     */
    private static function clean(string $v, int $max): string
    {
        $v = trim(preg_replace('/\s+/u', ' ', strip_tags($v)));
        $v = strtr($v, ['[' => '(', ']' => ')']);

        return Str::limit($v, $max, '…');
    }
}
