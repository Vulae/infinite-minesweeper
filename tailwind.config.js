/** @type {import('tailwindcss').Config} */
export default {
    content: [ './src/**/*.{html,js,svelte,ts}' ],
    theme: {
        extend: {
            fontFamily: {
                caveat: 'Caveat',
                segoe: [ 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif' ]
            },
            boxShadow: {
                'vignette-heavy': '0 0 min(100vw, 100vh) inset black',
                'vignette-medium': '0 0 min(100vw, 100vh) inset rgba(0, 0, 0, 0.7)',
                'vignette-light': '0 0 min(100vw, 100vh) inset rgba(0, 0, 0, 0.5)'
            }
        }
    },
    plugins: [],
}