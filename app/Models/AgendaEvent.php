<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AgendaEvent extends Model
{
    protected $fillable = [
        'title',
        'when_label',
        'when_date',
        'location',
        'tagline',
        'accent',
        'grad',
        'photo',
        'pos',
    ];

    protected $casts = [
        'when_date' => 'date:Y-m-d',
    ];
}
