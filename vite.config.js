// vite.config.js
import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
        plugins: [sveltekit()],        
        server:{
                fs:{
                        allow:['onssvelteplot','d3']
                }
        },
        //removes console.logs in production
        esbuild: {
                drop: ['console', 'debugger'],
        },
        ssr: {
                noExternal: ['layercake']
        } 
};

export default config;