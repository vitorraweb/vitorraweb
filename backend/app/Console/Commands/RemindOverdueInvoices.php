<?php

namespace App\Console\Commands;

use App\Mail\InvoiceMail;
use App\Models\Invoice;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class RemindOverdueInvoices extends Command
{
    protected $signature = 'invoices:remind {--days=3 : Minimum days between reminders for the same invoice}';

    protected $description = 'Email a reminder for each overdue, unpaid invoice (no more than once every few days).';

    public function handle(): int
    {
        $cooloff = now()->subDays(max(1, (int) $this->option('days')));

        $invoices = Invoice::whereIn('status', ['sent', 'partial'])
            ->whereNotNull('customer_email')
            ->whereDate('due_date', '<', now())
            ->where(fn ($q) => $q->whereNull('last_reminded_at')->orWhere('last_reminded_at', '<', $cooloff))
            ->get();

        $sent = 0;
        foreach ($invoices as $invoice) {
            if ($invoice->balance() <= 0) {
                continue;
            }
            $pdf = Pdf::loadView('documents.invoice', ['invoice' => $invoice->load('items')]);
            Mail::to($invoice->customer_email)->send(new InvoiceMail($invoice, $pdf->output(), reminder: true));
            $invoice->update(['last_reminded_at' => now()]);
            $sent++;
        }

        $this->info("Sent {$sent} overdue-invoice reminder(s).");

        return self::SUCCESS;
    }
}
