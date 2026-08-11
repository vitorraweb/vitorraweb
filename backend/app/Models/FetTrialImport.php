<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** One import run — the provenance behind a set of trips. */
class FetTrialImport extends Model
{
    protected $fillable = [
        'fet_trial_id', 'fet_trial_import_template_id',
        'filename', 'source_path', 'sheet', 'mapping',
        'rows_total', 'rows_imported', 'rows_flagged', 'rows_rejected', 'rejections',
        'imported_by',
    ];

    protected $casts = [
        'mapping' => 'array',
        'rejections' => 'array',
    ];

    public function trial(): BelongsTo
    {
        return $this->belongsTo(FetTrial::class, 'fet_trial_id');
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(FetTrialImportTemplate::class, 'fet_trial_import_template_id');
    }

    public function trips(): HasMany
    {
        return $this->hasMany(FetTrialTrip::class, 'fet_trial_import_id');
    }

    public function importer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'imported_by');
    }
}
