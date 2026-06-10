<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'company',
        'country',
        'department',
        'job_title',
        'start_date',
        'staff_status',
        'permissions',
        'documents',
        'notes',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'start_date'        => 'date',
            'permissions'       => 'array',
            'documents'         => 'array',
        ];
    }

    public function isAdmin(): bool { return $this->role === 'admin'; }
    public function isOps(): bool   { return in_array($this->role, ['admin', 'ops']); }

    /**
     * The operational admin modules this user may access. Admins get all;
     * otherwise an explicit per-person override wins, falling back to the
     * department default. "dashboard" is always included.
     *
     * @return array<int, string>
     */
    public function effectivePermissions(): array
    {
        $all = array_keys(config('admin_modules.modules', []));

        if ($this->isAdmin()) {
            return $all;
        }

        $perms = is_array($this->permissions)
            ? $this->permissions
            : (config('admin_modules.departments.'.$this->department) ?? []);

        $perms[] = 'dashboard';

        // Sanitise to known modules (drops anything stale/unknown).
        return array_values(array_intersect($all, array_unique($perms)));
    }

    /** Whether this user can access a given operational module. */
    public function canModule(string $module): bool
    {
        return $this->isAdmin() || in_array($module, $this->effectivePermissions(), true);
    }

    /** Identity payload returned to the client (admin nav gates on this). */
    public function toAuthArray(): array
    {
        return array_merge(
            $this->only(['id', 'name', 'email', 'role', 'department', 'job_title', 'staff_status']),
            ['permissions' => $this->effectivePermissions()],
        );
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function blogPosts(): HasMany
    {
        return $this->hasMany(BlogPost::class);
    }
}
