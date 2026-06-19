<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Screen extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'refresh_interval',
        'layout',
        'view_mode',
        'featured_widget_id',
        'screen_type',
        'screen_config',
    ];

    protected $casts = [
        'refresh_interval' => 'integer',
        'screen_config' => 'array',
    ];

    public function widgets(): HasMany
    {
        return $this->hasMany(Widget::class)->orderBy('grid_order');
    }

    public function featuredWidget(): BelongsTo
    {
        return $this->belongsTo(Widget::class, 'featured_widget_id');
    }
}
