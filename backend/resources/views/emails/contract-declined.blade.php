{{ $contract->buyer_name }} declined to sign contract {{ $contract->number }}.

Reason given:
{{ $contract->decline_reason ?: '(none given)' }}

Open the contract in the admin console (Sales > Contracts) to change it and send it again.
