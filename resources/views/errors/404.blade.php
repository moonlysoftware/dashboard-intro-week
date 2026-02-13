<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - Page Not Found</title>
    
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="bg-gradient-to-br from-[#6c52ff] via-[#d73fe8] to-[#ff4490] min-h-screen flex items-center justify-center p-5">
    <div class="text-center text-white max-w-2xl">
        <div class="text-8xl mb-8 animate-float">
            <img src="{{ asset('storage/404/404-illustration.png') }}" 
            alt="404 Not Found" 
            class="mx-auto w-64 h-64 object-contain animate-spin [animation-duration:10s]">
        </div>
        
        <div class="text-9xl font-bold mb-6 animate-float" style="font-family: 'Archia', sans-serif; text-shadow: 4px 4px 8px rgba(0, 0, 0, 0.3);">
            404
        </div>
        
        <h1 class="text-4xl font-semibold mb-4" style="font-family: 'Archia', sans-serif;">
            Page Not Found
        </h1>
        
        <p class="text-lg mb-8 opacity-90 leading-relaxed" style="font-family: 'Cera Pro', sans-serif;">
            Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
        </p>
        
        <div class="flex gap-4 justify-center flex-wrap">
            <a href="javascript:history.back()" 
               class="px-8 py-3 bg-transparent text-white border-2 border-white rounded-full font-semibold transition-all duration-200 hover:bg-white hover:text-[#6c52ff] hover:-translate-y-1 hover:shadow-xl"
               style="font-family: 'Cera Pro', sans-serif;">
                Go Back
            </a>
        </div>
    </div>

    <style>
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
        }
        .animate-float {
            animation: float 3s ease-in-out infinite;
        }
    </style>
</body>
</html>