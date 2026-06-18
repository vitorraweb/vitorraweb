A new job application has been received.

Role: {{ $application->opening->title ?? 'General application' }}
Name: {{ $application->name }}
Email: {{ $application->email }}
@if($application->phone)
Phone: {{ $application->phone }}
@endif
@if($application->location)
Location: {{ $application->location }}
@endif

Review applicants in the admin panel: https://vitorra.org/admin/careers

— Vitorra Holdings
