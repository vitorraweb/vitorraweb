<?php

namespace Database\Seeders;

use App\Models\FinanceCategory;
use Illuminate\Database\Seeder;

class FinanceCategoriesSeeder extends Seeder
{
    public function run(): void
    {
        $income = ['Product sales', 'Service income', 'Other income'];
        $expense = [
            'Salaries & wages', 'Rent', 'Utilities', 'Logistics & freight',
            'Supplier payments', 'Marketing', 'Office & supplies', 'Travel',
            'Professional fees', 'Bank charges', 'Taxes', 'Other expense',
        ];

        foreach ($income as $name) {
            FinanceCategory::firstOrCreate(['name' => $name, 'kind' => 'income']);
        }
        foreach ($expense as $name) {
            FinanceCategory::firstOrCreate(['name' => $name, 'kind' => 'expense']);
        }
    }
}
