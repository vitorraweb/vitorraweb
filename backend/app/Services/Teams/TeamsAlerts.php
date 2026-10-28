<?php

namespace App\Services\Teams;

use App\Models\ContactMessage;
use App\Models\Enquiry;
use App\Models\Order;
use App\Services\Marketing\EmailDesigner;

/**
 * The Teams messages for existing business events. Short, no personal
 * contact details beyond a name and company, and a link to the signed-in
 * console page where the full record is.
 */
class TeamsAlerts
{
    public function __construct(private TeamsNotifier $notifier) {}

    public function newEnquiry(Enquiry $e): void
    {
        $this->notifier->notify('new_enquiry', "enquiry:{$e->id}", TeamsCard::make('New enquiry: '.($e->company ?: $e->name))
            ->fact('Product', $e->product_category ?: 'General')
            ->fact('From', trim($e->name.($e->company ? ' · '.$e->company : '')))
            ->fact('Country', $e->country)
            ->fact('Routed to', $e->assigned_to)
            ->fact('Source', $e->lead_source)
            ->link(EmailDesigner::siteUrl('/admin/enquiries'), 'Open enquiries'));
    }

    public function newMessage(ContactMessage $m): void
    {
        $this->notifier->notify('new_message', "message:{$m->id}", TeamsCard::make('New website message from '.$m->name)
            ->fact('Subject', $m->subject ?: '(no subject)')
            ->link(EmailDesigner::siteUrl('/admin/messages'), 'Open messages'));
    }

    public function newOrder(Order $o, bool $reservation = false): void
    {
        $amount = $o->currency === 'USD' ? '$'.number_format($o->total / 100, 2) : 'UGX '.number_format($o->total);
        $this->notifier->notify('new_order', "order:{$o->id}", TeamsCard::make(($reservation ? 'New FET reservation ' : 'New order ').$o->reference)
            ->fact('Customer', $o->customer_name)
            ->fact('Total', $amount)
            ->fact('Payment', str_replace('_', ' ', (string) $o->payment_status))
            ->link(EmailDesigner::siteUrl('/admin/orders'), 'Open orders'));
    }

    /**
     * "The executive report has gone out". Headline numbers only; Google Ads
     * spend and leads are added only when the synced Google Ads data really
     * covers the period — never estimated or shown as zero by default.
     *
     * @param  array<string,mixed>  $summary  ExecutiveReportService::summary()
     */
    public function executiveReport(array $summary): void
    {
        $period = (string) ($summary['period'] ?? 'mtd');
        $rev = $summary['revenue'] ?? [];
        $card = TeamsCard::make('Executive report: '.($summary['period_label'] ?? $period))
            ->text('The report has been emailed to its recipients.')
            ->fact('Money received (UGX)', isset($rev['UGX']['current']) ? 'UGX '.number_format((int) $rev['UGX']['current']) : null)
            ->fact('Money received (USD)', ! empty($rev['USD']['current']) ? '$'.number_format($rev['USD']['current'] / 100, 2) : null)
            ->fact('New enquiries', $summary['enquiries']['current'] ?? null)
            ->fact('New orders', $summary['orders']['current'] ?? null);

        [$from, $to] = match ($period) {
            'week'       => [now()->subDays(6)->startOfDay(), now()],
            'last_month' => [now()->subMonthNoOverflow()->startOfMonth(), now()->subMonthNoOverflow()->endOfMonth()],
            default      => [now()->startOfMonth(), now()],
        };
        $ads = \App\Models\GoogleAdsCampaignDay::betweenDates($from->toDateString(), $to->toDateString());
        if ((clone $ads)->exists()) {
            $currency = \App\Models\GoogleAdsAccount::current()?->currency_code ?? '';
            $leads = \App\Models\Enquiry::where('lead_source', 'google / cpc')->whereBetween('created_at', [$from, $to])->count();
            $card->fact('Google Ads spend', trim($currency.' '.number_format((clone $ads)->sum('cost_micros') / 1_000_000, 2)))
                ->fact('Leads from Google Ads', $leads);
        }

        $this->notifier->notify('executive_report', 'executive:'.$period.':'.now()->toDateString(), $card->link(EmailDesigner::siteUrl('/admin/executive'), 'Open the Executive report'));
    }
}
