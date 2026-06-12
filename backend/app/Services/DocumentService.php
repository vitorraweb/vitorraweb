<?php

namespace App\Services;

use App\Models\Document;
use App\Models\Order;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Generates the order-lifecycle PDFs (reservation confirmation, payment
 * receipt, installation certificate) and records them as `Document` rows so
 * the customer portal's documents center can list them.
 */
class DocumentService
{
    public function generateReservationConfirmation(Order $order): Document
    {
        return $this->render($order, Document::TYPE_RESERVATION, 'Reservation Confirmation', 'documents.reservation-confirmation');
    }

    public function generatePaymentReceipt(Order $order): Document
    {
        return $this->render($order, Document::TYPE_RECEIPT, 'Payment Receipt', 'documents.payment-receipt');
    }

    public function generateInstallationCertificate(Order $order): Document
    {
        return $this->render($order, Document::TYPE_INSTALLATION, 'Installation Certificate', 'documents.installation-certificate');
    }

    private function render(Order $order, string $type, string $title, string $view): Document
    {
        $order->loadMissing('items');

        $pdf = Pdf::loadView($view, ['order' => $order]);

        $filename = Str::slug($title) . '-' . $order->reference . '-' . now()->timestamp . '.pdf';
        $path = "documents/{$order->reference}/{$filename}";

        Storage::disk('public')->put($path, $pdf->output());

        return $order->documents()->create([
            'type'         => $type,
            'title'        => "{$title} — {$order->reference}",
            'path'         => $path,
            'url'          => Storage::disk('public')->url($path),
            'generated_at' => now(),
        ]);
    }
}
