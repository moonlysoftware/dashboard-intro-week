<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Widget extends Model
{
    use HasFactory;

    protected $fillable = [
        'screen_id',
        'widget_type',
        'config',
        'grid_col_span',
        'grid_row_span',
        'grid_order',
    ];

    protected $casts = [
        'config' => 'array',
        'grid_col_span' => 'integer',
        'grid_row_span' => 'integer',
        'grid_order' => 'integer',
    ];

    public function screen(): BelongsTo
    {
        return $this->belongsTo(Screen::class);
    }
}
