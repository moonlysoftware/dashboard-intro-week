<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Person extends Model
{
    protected $table = 'persons';

    protected $fillable = ['name', 'photo', 'birth_date', 'jubileum_start_date'];

    protected $casts = [
        'birth_date'           => 'date',
        'jubileum_start_date'  => 'date',
    ];
}
