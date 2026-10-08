<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Quotations, and the fields the Finance team's branded Coffee / FET
     * templates print (attention, tax ID, incoterms, port, schedules…).
     * Amounts follow the invoices convention: UGX in shillings, USD/EUR in cents.
     */
    public function up(): void
    {
        $documentFields = function (Blueprint $table) {
            $table->string('business', 10)->nullable();          // coffee | fet (null = general Vitorra layout)
            $table->string('customer_attention')->nullable();
            $table->string('customer_tax_id', 64)->nullable();
            $table->string('customer_phone', 64)->nullable();
            $table->string('sales_contact')->nullable();
            $table->string('reference')->nullable();               // e.g. "FET – PRO II"
            $table->string('incoterms')->nullable();               // e.g. "CIF Hamburg (Incoterms® 2020)"
            $table->string('port_of_loading')->nullable();
            $table->string('payment_terms')->nullable();           // short line in the information box
            $table->text('payment_schedule')->nullable();          // full wording in the terms section
            $table->text('inspection')->nullable();
            $table->text('shipment_schedule')->nullable();         // coffee shipment / FET delivery terms
            $table->unsignedTinyInteger('deposit_percent')->nullable();
            $table->unsignedTinyInteger('tax_rate')->default(0);
            $table->string('tax_label')->nullable();
            $table->string('total_label')->nullable();
        };

        Schema::create('quotations', function (Blueprint $table) use ($documentFields) {
            $table->id();
            $table->string('number')->unique();
            $table->string('status')->default('draft');            // draft | sent | accepted | declined | void
            $table->string('customer_name');
            $table->string('customer_email')->nullable();
            $table->text('customer_address')->nullable();
            $table->string('currency', 3)->default('UGX');
            $table->date('issue_date');
            $table->date('valid_until')->nullable();
            $documentFields($table);
            $table->bigInteger('subtotal')->default(0);
            $table->bigInteger('tax_total')->default(0);
            $table->bigInteger('total')->default(0);
            $table->text('notes')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index('status');
        });

        Schema::create('quotation_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quotation_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('position')->default(0);
            $table->string('name');
            $table->text('details')->nullable();
            $table->unsignedBigInteger('quantity')->default(1);
            $table->string('unit', 20)->nullable();
            $table->bigInteger('unit_price')->default(0);
            $table->bigInteger('line_total')->default(0);
            $table->timestamps();
        });

        Schema::table('invoices', function (Blueprint $table) use ($documentFields) {
            $documentFields($table);
            $table->string('kind', 12)->default('standard');       // standard | commercial | final
            $table->foreignId('quotation_id')->nullable()->constrained()->nullOnDelete();
        });

        Schema::table('invoice_items', function (Blueprint $table) {
            $table->text('details')->nullable();
            $table->string('unit', 20)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('invoice_items', fn (Blueprint $t) => $t->dropColumn(['details', 'unit']));
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropConstrainedForeignId('quotation_id');
            $table->dropColumn([
                'kind', 'business', 'customer_attention', 'customer_tax_id', 'customer_phone', 'sales_contact',
                'reference', 'incoterms', 'port_of_loading', 'payment_terms', 'payment_schedule', 'inspection',
                'shipment_schedule', 'deposit_percent', 'tax_rate', 'tax_label', 'total_label',
            ]);
        });
        Schema::dropIfExists('quotation_items');
        Schema::dropIfExists('quotations');
    }
};
