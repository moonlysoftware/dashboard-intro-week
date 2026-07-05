import { defineConfig, loadEnv } from "vite";
import laravel from "laravel-vite-plugin";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const hmrHost = env.VITE_HMR_HOST || "localhost";

    return {
        plugins: [
            laravel({
                input: ["resources/js/app.tsx", "resources/css/app.css"],
                refresh: true,
            }),
            react(),
        ],
        server: {
            host: "0.0.0.0",
            port: 5173,
            hmr: {
                host: hmrHost,
                port: 5173,
            },
            watch: {
                usePolling: true,
            },
        },
    };
});
