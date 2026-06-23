<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    protected $fillable = [
        'style',
        'badge',
        'title',
        'photo',
        'pos',
        'date',
        'time',
        'location',
        'body',
    ];
}
