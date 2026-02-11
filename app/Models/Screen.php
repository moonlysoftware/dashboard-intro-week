<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Screen extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'refresh_interval',
        'is_active',
        'layout',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'refresh_interval' => 'integer',
    ];

    public function widgets(): HasMany
    {
        return $this->hasMany(Widget::class)->orderBy('grid_order');
    }
}
