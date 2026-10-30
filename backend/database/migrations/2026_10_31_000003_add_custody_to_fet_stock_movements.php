<?php

use App\Models\FetStockMovement;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Finance wants to know where every device is kept, not only how many there
 * are. Each movement now names the person or office holding the devices it
 * moves (the "received by" for a delivery, "taken from" for a sale), and a
 * hand-over between two holders is a linked pair of rows.
 *
 * Existing entries: a delivery goes to whoever was written as receiving it,
 * everything else to the Operations office, which is the main store.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fet_stock_movements', function (Blueprint $table) {
            $table->string('holder')->nullable()->after('picked_by');
            $table->uuid('transfer_id')->nullable()->after('holder');
            $table->index(['holder', 'model']);
            $table->index('transfer_id');
        });

        DB::table('fet_stock_movements')->orderBy('id')->each(function ($row) {
            $holder = in_array($row->type, ['received', 'returned'], true) ? FetStockMovement::normaliseHolder($row->picked_by) : FetStockMovement::MAIN_HOLDER;
            DB::table('fet_stock_movements')->where('id', $row->id)->update(['holder' => $holder]);
        });
    }

    public function down(): void
    {
        DB::table('fet_stock_movements')->where('type', 'transfer')->delete();
        Schema::table('fet_stock_movements', function (Blueprint $table) {
            $table->dropIndex(['holder', 'model']);
            $table->dropIndex(['transfer_id']);
            $table->dropColumn(['holder', 'transfer_id']);
        });
    }
};
