@php
    $locale = session('locale')
        ?? (auth()->check() && method_exists(auth()->user(), 'getAttribute') ? auth()->user()->preferred_language : null)
        ?? app()->getLocale();
    $direction = $locale === 'ar' ? 'rtl' : 'ltr';
    $theme = auth()->check() ? (auth()->user()->theme_preference ?? 'system') : 'system';
@endphp
<!DOCTYPE html>
<html lang="{{ $locale }}" dir="{{ $direction }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Einaya') }}</title>

        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link
            href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
            rel="stylesheet"
        >

        <script>
            (function () {
                try {
                    var stored = localStorage.getItem('einaya-theme');
                    var theme = stored || @json($theme);
                    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    var dark = theme === 'dark' || (theme === 'system' && prefersDark);
                    document.documentElement.classList.toggle('dark', dark);
                } catch (e) {}
            })();
        </script>

        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="antialiased">
        @inertia
    </body>
</html>
