<?php

namespace App\Console\Commands;

use App\Services\ReceiptInbox;
use Illuminate\Console\Command;

/** AI-read newly scanned receipts in the background (every minute; no-op when idle). */
class ReadReceipts extends Command
{
    protected $signature = 'receipts:read';

    protected $description = 'Read newly scanned receipts (vendor, date, amount, VAT) for the Finance inbox';

    public function handle(ReceiptInbox $inbox): int
    {
        $n = $inbox->readPending();
        if ($n) {
            $this->info("Read {$n} receipt(s).");
        }

        return self::SUCCESS;
    }
}
