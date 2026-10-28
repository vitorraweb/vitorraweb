<?php

namespace App\Services\Marketing;

/**
 * Ready-made campaign layouts Marketing starts from (the "pre-templates").
 * Defined here rather than in the database so every copy of the console has
 * them, and they always pass through the same normaliser as a saved design.
 * Images are the site's own JPGs (Outlook does not show WebP).
 */
class StarterDesigns
{
    /** @return list<array{key:string, name:string, description:string, design:array}> */
    public static function all(): array
    {
        $img = fn (string $path) => EmailDesigner::siteUrl($path);

        $starters = [
            [
                'key' => 'announcement',
                'name' => 'Product announcement',
                'description' => 'Hero photo, headline, the case in two paragraphs, a strong call to action and a feature row.',
                'design' => [
                    'settings' => ['canvas' => '#F2F2F2', 'background' => '#FFFFFF', 'font' => 'arial'],
                    'blocks' => [
                        ['type' => 'logo', 'props' => ['width' => 84, 'paddingY' => 28]],
                        ['type' => 'image', 'props' => ['src' => $img('/photos/hero-02-fet.jpg'), 'alt' => 'Fuel Eco Tech fitted to a fuel line', 'width' => 100, 'paddingX' => 0, 'paddingY' => 0]],
                        ['type' => 'heading', 'props' => ['text' => '13.9% less fuel, independently measured', 'size' => 30, 'align' => 'left', 'paddingY' => 28]],
                        ['type' => 'text', 'props' => ['html' => '<p>Dear {name},</p><p>Fuel Eco Tech cut a VW T5\'s consumption from 11.52 to 9.92 litres per 100 km in an independent German test. For a fleet, that is money back every month.</p>']],
                        ['type' => 'button', 'props' => ['label' => 'Book a free fuel assessment', 'url' => '/enquire?sector=FET', 'color' => '#1E1E1E', 'paddingY' => 20]],
                        ['type' => 'divider', 'props' => ['paddingY' => 20]],
                        ['type' => 'columns', 'props' => ['src' => $img('/photos/poster-fet.jpg'), 'alt' => 'Fuel Eco Tech', 'html' => '<p><strong>Certified and insured</strong></p><p>ISO 9001, 14001 and 27001, Zurich product liability, lab-validated by AVL.</p>', 'imageSide' => 'left']],
                        ['type' => 'spacer', 'props' => ['height' => 24]],
                    ],
                ],
            ],
            [
                'key' => 'letter',
                'name' => 'Simple letter',
                'description' => 'A personal note on the letterhead: logo, message, one button. Reads like an email from a person.',
                'design' => [
                    'settings' => ['canvas' => '#F2F2F2', 'background' => '#FFFFFF', 'font' => 'arial'],
                    'blocks' => [
                        ['type' => 'logo', 'props' => ['width' => 84, 'paddingY' => 28]],
                        ['type' => 'divider', 'props' => ['width' => 100, 'paddingY' => 4]],
                        ['type' => 'text', 'props' => ['html' => '<p>Dear {name},</p><p>Write your message here. Keep it short: what you offer, why it matters to them, and one clear next step.</p><p>Kind regards,<br>The Vitorra team</p>', 'paddingY' => 28]],
                        ['type' => 'button', 'props' => ['label' => 'Reply or request a quote', 'url' => '/enquire', 'paddingY' => 8]],
                        ['type' => 'spacer', 'props' => ['height' => 28]],
                    ],
                ],
            ],
            [
                'key' => 'newsletter',
                'name' => 'Newsletter',
                'description' => 'A headline story and two feature rows, for monthly updates across the four businesses.',
                'design' => [
                    'settings' => ['canvas' => '#EDEFE3', 'background' => '#FFFFFF', 'font' => 'arial'],
                    'blocks' => [
                        ['type' => 'logo', 'props' => ['width' => 72, 'paddingY' => 22]],
                        ['type' => 'heading', 'props' => ['text' => 'News from Vitorra', 'size' => 26, 'align' => 'center', 'paddingY' => 6]],
                        ['type' => 'text', 'props' => ['html' => '<p>The month in fuel savings, coffee, logistics and first aid.</p>', 'align' => 'center', 'color' => '#6B6B6B', 'size' => 14]],
                        ['type' => 'image', 'props' => ['src' => $img('/photos/process-coffee-cherries.jpg'), 'alt' => 'Ugandan Arabica cherries', 'width' => 100, 'radius' => 6]],
                        ['type' => 'heading', 'props' => ['text' => 'Ugandan Arabica, from Mount Elgon', 'size' => 22, 'paddingY' => 14]],
                        ['type' => 'text', 'props' => ['html' => '<p>Write the lead story here.</p>']],
                        ['type' => 'divider', 'props' => ['paddingY' => 16, 'color' => '#E3DFD5']],
                        ['type' => 'columns', 'props' => ['src' => $img('/photos/hero-03-seal.jpg'), 'alt' => 'SEAL wound spray', 'html' => '<p><strong>SEAL Wound Spray</strong></p><p>FDA-cleared bleeding control with a 36-month shelf life.</p>', 'imageSide' => 'left']],
                        ['type' => 'columns', 'props' => ['src' => $img('/photos/process-road.jpg'), 'alt' => 'Logistics on the Northern Corridor', 'html' => '<p><strong>Logistics</strong></p><p>One named contact from Mombasa to Kampala.</p>', 'imageSide' => 'right']],
                        ['type' => 'button', 'props' => ['label' => 'Visit vitorra.org', 'url' => '/', 'align' => 'center', 'paddingY' => 24]],
                    ],
                ],
            ],
            [
                'key' => 'event',
                'name' => 'Event invitation',
                'description' => 'Centred invitation on a dark canvas: date, place and an RSVP button.',
                'design' => [
                    'settings' => ['canvas' => '#1E1E1E', 'background' => '#FFFFFF', 'font' => 'helvetica'],
                    'blocks' => [
                        ['type' => 'logo', 'props' => ['width' => 84, 'paddingY' => 28]],
                        ['type' => 'image', 'props' => ['src' => $img('/photos/launch-presenters.jpg'), 'alt' => 'Vitorra launch', 'width' => 100, 'paddingX' => 0, 'paddingY' => 0]],
                        ['type' => 'heading', 'props' => ['text' => 'You are invited', 'size' => 34, 'align' => 'center', 'paddingY' => 26]],
                        ['type' => 'text', 'props' => ['html' => '<p><strong>Thursday 20 November, 10:00</strong><br>Padre Pio House, Lumumba Avenue, Kampala</p><p>Join us for a live demonstration of Fuel Eco Tech.</p>', 'align' => 'center']],
                        ['type' => 'button', 'props' => ['label' => 'Reserve my seat', 'url' => 'mailto:support@vitorra.org?subject=RSVP', 'align' => 'center', 'color' => '#7A6020', 'radius' => 24, 'paddingY' => 18]],
                        ['type' => 'spacer', 'props' => ['height' => 28]],
                    ],
                ],
            ],
        ];

        return array_map(fn ($s) => ['design' => EmailDesigner::normalise($s['design'], 'starter')] + $s, $starters);
    }
}
