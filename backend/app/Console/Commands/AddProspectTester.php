<?php

namespace App\Console\Commands;

use App\Models\Prospect;
use Illuminate\Console\Command;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Validator;

/**
 * Adds one of our own addresses to the prospect list so the team can send a
 * campaign to themselves and see exactly what a real prospect receives —
 * sender, subject, personalisation and attachments — before it goes out to the
 * live list. Filed under INTERNAL_TEST by default, so test rows never inflate a
 * real industry's count or get swept into a genuine send.
 */
class AddProspectTester extends Command
{
    protected $signature = 'prospects:add-tester
        {email : Address to add (e.g. john@vitorra.org)}
        {--name= : Company name shown in the email; defaults to the address}
        {--product=SEAL : Which product list to add it to (FET, SEAL)}
        {--category=INTERNAL_TEST : Vertical to file it under}';

    protected $description = "Add one of our own addresses as a prospect, to preview how a campaign arrives.";

    public function handle(): int
    {
        $email    = strtolower(trim($this->argument('email')));
        $product  = strtoupper((string) $this->option('product'));
        $category = strtoupper((string) $this->option('category'));
        $name     = $this->option('name') ?: $email;

        $validator = Validator::make(
            ['email' => $email, 'product' => $product, 'category' => $category],
            [
                'email'    => ['required', 'email'],
                'product'  => ['required', Rule::in(Prospect::PRODUCTS)],
                'category' => ['required', Rule::in(Prospect::categoriesFor($product))],
            ]
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        $prospect = Prospect::updateOrCreate(
            ['name' => $name, 'category' => $category, 'product' => $product],
            [
                'email'           => $email,
                'location'        => 'Internal — campaign preview',
                'outreach_status' => 'not_contacted',
                'source'          => 'internal test',
            ]
        );

        $this->info(($prospect->wasRecentlyCreated ? 'Added' : 'Updated')." {$name} <{$email}> on the {$product} list ({$category}).");
        $this->newLine();
        $this->line('  In /admin/prospects: pick the '.$product.' product, then the "Internal test" industry,');
        $this->line('  tick the row, and send a campaign to see exactly what a prospect receives.');

        return self::SUCCESS;
    }
}
