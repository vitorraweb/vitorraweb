A new supplier has submitted their details for review.

Company: {{ $supplier->company_name }}
Contact: {{ $supplier->contact_name ?? '—' }}
Email: {{ $supplier->email }}
@if($supplier->phone)
Phone: {{ $supplier->phone }}
@endif
@if($supplier->category)
Supplies: {{ $supplier->category }}
@endif
Documents attached: {{ $supplier->documents_count ?? $supplier->documents()->count() }}

Review and approve in the admin panel: https://vitorra.org/admin/suppliers

— Vitorra Holdings
